import json, os
from datetime import date
from config import DATA_DIR

def _path(uid): return os.path.join(DATA_DIR, f"{uid}.json")

def load(uid):
    p = _path(uid)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}

def save(uid, data):
    with open(_path(uid), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_profile(uid): return load(uid).get('profile')
def get_kbju(uid):    return load(uid).get('kbju')

def save_profile(uid, profile):
    d = load(uid); d['profile'] = profile; save(uid, d)

def save_kbju(uid, kbju):
    d = load(uid); d['kbju'] = kbju; save(uid, d)

def today(): return date.today().isoformat()

def get_diary(uid):
    return load(uid).get('diary', {}).get(today(), [])

def add_entry(uid, entry):
    d = load(uid)
    d.setdefault('diary', {}).setdefault(today(), []).append(entry)
    save(uid, d)

def get_water(uid):
    return load(uid).get('water', {}).get(today(), 0.0)

def add_water(uid, ml):
    d = load(uid)
    d.setdefault('water', {})[today()] = d.get('water', {}).get(today(), 0.0) + ml
    save(uid, d)
    return d['water'][today()]
