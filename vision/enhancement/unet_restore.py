"""
U-Net image restoration model trained self-supervised on PAD-UFES-20.
Residual architecture: output = clamp(input + unet(input), 0.0, 1.0).
Channels: 32 -> 64 -> 128 -> 256 -> 512.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class DoubleConv(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.conv(x)

class Down(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.mpconv = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_ch, out_ch)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.mpconv(x)

class Up(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.up = nn.Upsample(scale_factor=2, mode="bilinear", align_corners=True)
        self.conv = DoubleConv(in_ch, out_ch)

    def forward(self, x1: torch.Tensor, x2: torch.Tensor) -> torch.Tensor:
        x1 = self.up(x1)
        # Pad x1 if necessary to match x2 size exactly
        diff_y = x2.size()[2] - x1.size()[2]
        diff_x = x2.size()[3] - x1.size()[3]
        if diff_x > 0 or diff_y > 0:
            x1 = F.pad(x1, [diff_x // 2, diff_x - diff_x // 2,
                            diff_y // 2, diff_y - diff_y // 2])
        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)

class UNetRestore(nn.Module):
    def __init__(self, in_channels: int = 3, out_channels: int = 3, features: list = None, residual: bool = True):
        super().__init__()
        if features is None:
            features = [32, 64, 128, 256, 512]
            
        self.residual = residual
        f = features
        
        # Encoder (4 down levels)
        self.inc = DoubleConv(in_channels, f[0])      # 3 -> 32
        self.down1 = Down(f[0], f[1])                 # 32 -> 64
        self.down2 = Down(f[1], f[2])                 # 64 -> 128
        self.down3 = Down(f[2], f[3])                 # 128 -> 256
        self.down4 = Down(f[3], f[4])                 # 256 -> 512 (bottleneck)
        
        # Decoder (4 up levels with skip connections)
        self.up1 = Up(f[4] + f[3], f[3])              # (512+256) -> 256
        self.up2 = Up(f[3] + f[2], f[2])              # (256+128) -> 128
        self.up3 = Up(f[2] + f[1], f[1])              # (128+64) -> 64
        self.up4 = Up(f[1] + f[0], f[0])              # (64+32) -> 32
        
        # Final 1x1 conv
        self.outc = nn.Conv2d(f[0], out_channels, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        in_img = x
        # Encoder
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)
        
        # Decoder
        d = self.up1(x5, x4)
        d = self.up2(d, x3)
        d = self.up3(d, x2)
        d = self.up4(d, x1)
        res = self.outc(d)
        
        if self.residual:
            return torch.clamp(in_img + res, 0.0, 1.0)
        else:
            return torch.clamp(res, 0.0, 1.0)
