import { useState } from "react";
import { updateCreateProfile } from "./JS/fileSystem"

import { useState } from "react";

function profileCard() {
    const [Name, isName] = useState();

    return (
        <div className="ProfCard">
            <h2>Name</h2>
            <button>Start</button>
        </div>
    );

}

export default profileCard