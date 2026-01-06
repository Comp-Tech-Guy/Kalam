import { mkdir, readTextFile, exists, BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";

export async function initializeStorage() {
    try {
        // Checking for UserData Folder
        const folderExists = await exists('UserData', { baseDir: BaseDirectory.AppData })
        if (!folderExists) {
            await mkdir('UserData', {
                baseDir: BaseDirectory.AppData,
                recursive: true
            });
            console.log("App data directory created.");
        }

        const fileExist = await exists("UserData\\profile.json", {baseDir: BaseDirectory.AppData})
        if(!fileExist) {
            await writeTextFile("UserData\\profile.json", JSON.stringify([]), {
                baseDir: BaseDirectory.AppData
            });
        }
        return true;
    } catch (e) {
        console.log("could not initialize : ", e)
        return false;
    }
}

export async function updateCreateProfile(isInitialized, all_desktop, image_path, rainmeter_path, layout) {    
    const stringWallPath = String.raw`${image_path}`;
    const stringRainPath = String.raw`${rainmeter_path}`;

    if (isInitialized) {
        const jsonData = [
            {
                "All_desktop": all_desktop,
                "Rainmeter": stringRainPath,
                "RainmeterLayout": layout,
                "Wallpaper_Path": stringWallPath
            }
        ];

        const profileJSon = await readTextFile("UserData\\profile.json", { baseDir: BaseDirectory.AppData });
        const profileJSON2 = JSON.parse(profileJSon);
        profileJSON2.push(jsonData);

        await writeTextFile("UserData\\profile.json", JSON.stringify(profileJSON2, null, 2), { baseDir: BaseDirectory.AppData });
    }
    else{
        initializeStorage()
    }
}