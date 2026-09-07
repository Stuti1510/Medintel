import sqlite3

def verify():
    conn = sqlite3.connect('medintel.db')
    cursor = conn.cursor()
    tables = [t[0] for t in cursor.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall() if not t[0].startswith('sqlite_')]
    print(f"Total tables created in medintel.db: {len(tables)}")
    for t in sorted(tables):
        cols = cursor.execute(f"PRAGMA table_info({t})").fetchall()
        count = cursor.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
        print(f"  [TABLE] {t:28} | {len(cols):2} columns | {count:4} rows")
    conn.close()

if __name__ == '__main__':
    verify()
