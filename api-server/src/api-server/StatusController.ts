import { StatusApi } from "../schema/Status"

export class StatusController extends StatusApi.makeController() {
    static {
        StatusApi.makeControllerImpl(this, {
            async _init() {
                this.ready = true
            },
        })
    }
}
