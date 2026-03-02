import "./App.css"
import { addData, editData, getData, removeData } from "../JS/fileSystem";
import { useEffect, useState } from "react";

function App(){
    const [data, setData] = useState(null);
    const dataRecieve = async () => {
        const json = await getData("userProfiles.json");
        setData(json);
    }

    useEffect(() => {
        dataRecieve();
    }, [])

    const addButton = () => {
        const newData = {
            "id": 1,
            "wallaper": "222"
        }
        addData("userProfiles.json", newData)
    }

    const removeButton = () => {
        removeData("userProfiles.json", 1)
    }

    const editButton = () => {
        const data = {
            "id": 1,
            "wallaper": "333"
        }
        editData("userProfiles.json", data)
    }

    return (
        <main className="AppPg">
            <h1>Welcome to Home</h1>
            <button onClick={addButton}>Add</button>
            <button onClick={removeButton}>Remove</button>
            <button onClick={editButton}>Edit</button>
        </main>
    );
}

export default App