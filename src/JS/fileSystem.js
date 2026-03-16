import {mkdir, exists, writeTextFile, readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";

export async function initializeFS(){
    try{
        await mkdir('', {
            baseDir: BaseDirectory.AppData,
            recursive: true
        });
        
        const files = ['userSettings.json', 'userProfiles.json']
        const fileExist = await exists(files[0], {
            baseDir: BaseDirectory.AppData
        });
        const fileExist2 = await exists(files[1], {
            baseDir: BaseDirectory.AppData
        });
        if(!fileExist){
            await writeTextFile(files[0], JSON.stringify({
                "rainmeter-Path": "",
                "Yasb-Config-Path": ""
            }, null, 2), {
                baseDir:BaseDirectory.AppData
            });
        }
        if(!fileExist2){
            await writeTextFile(files[1], JSON.stringify({
                profiles:[]
            }, null, 2), {
                baseDir:BaseDirectory.AppData
            });
        }
    }catch(error){
        console.log(error);
    }
}

async function update(fileName, updatedData){
    const appDataPath = await appDataDir();
    const filePath = await join(appDataPath, '', fileName);
    await writeTextFile(filePath, JSON.stringify(updatedData, null, 2))
}

export async function getData(fileName){
    try{
        const appDataPath = await appDataDir();
        const filePath = await join(appDataPath, '', fileName);
        const contents = await readTextFile(filePath);
        return JSON.parse(contents);
    }catch(error){
        console.log(error);
    }
}

export async function getLength(fileName){
    const data = await getData(fileName);
    return data.profiles.length;
}

export async function addData(fileName, newData){
    try{
        const currentData = await getData(fileName);
        const updatedData = {
            ...currentData,
            "profiles": [
                ...currentData.profiles,
                newData
            ]
        };
        update(fileName, updatedData);
    }catch(error){
        console.log(error);
    }
}

export async function removeData(fileName, target_id){
    try{
        if(fileName === "userProfiles.json"){
            const currentData = await getData(fileName);
            const updatedData = {
                profiles: currentData.profiles.filter(p => p.id != target_id)
            }
            update(fileName, updatedData);
        }else{
            const currentData = await getData(fileName);
            if(currentData.hasOwnProperty(target_id) && currentData[target_id] != ""){
                currentData[target_id] = "";
                update(fileName, currentData);
            }
        }
    }catch(error){
        console.log(error);
    }
}

export async function editData(fileName, targetedData){
    try{
        if(fileName === "userProfiles.json"){
            const currentData = await getData(fileName);
            const updatedData  = {
                profiles: currentData.profiles.map((p) =>{
                    if(p.id == targetedData.id){
                        return targetedData;
                    }
                    return p;
                })
            }
            update(fileName, updatedData);
        }else{
            const currentData = await getData(fileName);
            const arrayList = Object.keys(currentData)
            for (let i = 0; i < arrayList.length; i++) {
                currentData[arrayList[i]] = targetedData[arrayList[i]];
            }
            update(fileName, currentData);
        }
    }catch(error){
        console.log(error);
    }
}