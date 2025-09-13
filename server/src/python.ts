import { spawn } from 'child_process';

export async function runPython(code: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise(resolve => {
    const proc = spawn('python', ['-'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      stderr += '\n[timeout]';
      proc.kill('SIGKILL');
    }, 5000);
    proc.stdout.on('data', d => {
      stdout += d.toString();
    });
    proc.stderr.on('data', d => {
      stderr += d.toString();
    });
    proc.on('close', () => {
      clearTimeout(timer);
      resolve({ stdout, stderr });
    });
    proc.stdin.end(code);
  });
}
