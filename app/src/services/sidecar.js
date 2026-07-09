import { appDataDir } from "@tauri-apps/api/path";
import { Command } from "@tauri-apps/plugin-shell";

async function SideCar(profileId) {
    const folder = await appDataDir()
    const command = Command.sidecar('binaries/kalam-core/kalam-core' , [folder, profileId.toString()]);
    const output = await command.execute();
    if (output.code !== 0) {
        throw new Error(output.stderr || output.stdout || `Sidecar exited with code ${output.code}`);
    }
    return output.stdout;
}

export async function autoDetectPaths() {
    const folder = await appDataDir();
    const command = Command.sidecar('binaries/kalam-core/kalam-core', [folder, 'autodetect']);
    const output = await command.execute();
    if (output.code !== 0) {
        throw new Error(output.stderr || output.stdout || `Sidecar exited with code ${output.code}`);
    }
    return JSON.parse(output.stdout);
}

export async function stopAll() {
    return SideCar('stop-all');
}

export default SideCar;