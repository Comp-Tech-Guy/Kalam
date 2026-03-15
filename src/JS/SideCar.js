import { appDataDir } from "@tauri-apps/api/path";
import { Command } from "@tauri-apps/plugin-shell";

async function SideCar(profileId) {
    const folder = await appDataDir()
    const command = Command.sidecar('binaries/my-sidecar/kalam-Sidecar' , folder, profileId);
    const output = await command.execute();
    return output.stdout;
}

export default SideCar;