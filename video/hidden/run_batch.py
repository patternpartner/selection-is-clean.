"""One launch of 'Hidden's decision runs: keep up to MAXP jobs going until about MINUTES from now, then stop; relaunch
until it says all done (each launch fits inside the ~30 minutes a job may run here).
  MAXP=3 MINUTES=26 python3 video/hidden/run_batch.py

Per seed S (SEEDS): turner-S (clone.py, 20 rounds from nothing) -> control-S and hidden-S (10 more rounds from turner-S's
clone, penalty 0 and PENALTY) -> an inspection (inspect_hidden.py) of all three. A job's outputs are written at its end
(run.json for a robot, hidden.json for an inspection), so a job killed part-way left nothing that counts: it simply runs
again. A job starts only if its usual time fits in what is left.
"""
import os, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(REPO, 'out', 'hidden', 'runs')
SEEDS = [51, 52, 53, 54, 55]
PENALTY = 10.0
MAXP = int(os.environ.get('MAXP', 3))
END = time.time() + 60 * float(os.environ.get('MINUTES', 26))
NEED = {'turner': 16, 'cont': 12, 'inspect': 14}      # minutes, with company


def d(name):
    return os.path.join(OUT, name)


def jobs():
    """(name, kind, ready, done, argv) in order of preference"""
    out = []
    for s in SEEDS:
        t = d(f'turner-{s}')
        out.append((f'turner-{s}', 'turner', True, os.path.exists(os.path.join(t, 'run.json')),
                    ['video/hidden/clone.py', '--seed', str(s), '--iters', '20', '--days', '64', '--epochs', '4', '--out', t]))
    for s in SEEDS:
        t = d(f'turner-{s}')
        for arm, pen in (('control', 0.0), ('hidden', PENALTY)):
            o = d(f'{arm}-{s}')
            out.append((f'{arm}-{s}', 'cont', os.path.exists(os.path.join(t, 'run.json')), os.path.exists(os.path.join(o, 'run.json')),
                        ['video/hidden/clone.py', '--seed', str(s), '--start', os.path.join(t, 'clone.pt'), '--iters', '10', '--days', '64',
                         '--epochs', '4', '--critic_days', '256', '--penalty', str(pen), '--out', o]))
    for s in SEEDS:
        for arm in ('control', 'hidden', 'turner'):
            o = d(f'{arm}-{s}')
            out.append((f'inspect {arm}-{s}', 'inspect', os.path.exists(os.path.join(o, 'run.json')), os.path.exists(os.path.join(o, 'hidden.json')),
                        ['video/hidden/inspect_hidden.py', o]))
    return out


os.makedirs(OUT, exist_ok=True)
running = {}
while True:
    for name, p in list(running.items()):
        if p.poll() is not None:
            print(f'{time.strftime("%H:%M")} finished {name} (exit {p.returncode})', flush=True)
            del running[name]
    left = (END - time.time()) / 60
    for name, kind, ready, done, argv in jobs():
        if len(running) >= MAXP:
            break
        if done or not ready or name in running or left < NEED[kind] + 1:
            continue
        log = open(os.path.join(OUT, name.replace(' ', '_') + '.log'), 'w')
        running[name] = subprocess.Popen(['timeout', str(int(left * 60)), sys.executable, '-W', 'ignore'] + argv, cwd=REPO,
                                         stdout=log, stderr=subprocess.STDOUT)
        print(f'{time.strftime("%H:%M")} started {name} ({left:.0f} min left)', flush=True)
    if not running:
        break
    time.sleep(10)
todo = [n for n, k, r, dn, a in jobs() if not dn]
print('ALL DONE' if not todo else f'{len(todo)} still to do: {", ".join(todo)}', flush=True)
