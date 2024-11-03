import { Type } from "@apsides/struct"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

export const ENV = Type.object({
    PORT: Type.string,
    CA_NAME: Type.string,
    CHALLENGE_PATH: Type.string
}).deserialize(process.env)
