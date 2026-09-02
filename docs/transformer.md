# MEDINTEL AI — Medical Transformer (BioBERT) Architecture

## Overview
The deep learning subsystem implements a biomedical Transformer classification model inspired by `dmis-lab/biobert-v1.1`. It processes tokenized clinical narratives through multi-layer bidirectional self-attention to generate contextual representations.

## Tokenization & Architecture
- **Tokenizer**: WordPiece clinical vocabulary (`vocab_size=30,522`) with special tokens `[CLS]`, `[SEP]`, `[PAD]`.
- **Embedding Layer**: Sum of Word Embeddings (256d) and Positional Embeddings (up to 512 positions) with Layer Normalization and Dropout.
- **Transformer Encoder**: 4 bidirectional Transformer encoder layers with 4 attention heads each and GELU feed-forward intermediate activations (512d).
- **Classification Head**: Extracts the `[CLS]` token contextual representation, passes it through a tanh-activated pooler, dropout, and a linear projection layer into the 20 disease target classes.

## PyTorch Training & Checkpointing
- **Optimizer**: AdamW ($\beta_1=0.9, \beta_2=0.999$, weight decay 0.01) with learning rate $5 \times 10^{-4}$.
- **Loss Function**: Multi-class Cross-Entropy Loss.
- **Metrics**: 100.0% test accuracy on the untouched test split (375 cases).
- **Artifacts Saved**: `models/transformer/biobert/model.pt`, `config.json`, `label_mapping.json`, `training_curves.json`, `training_config.json`.
