import express from "express";
import { CalendarController } from "./calendar.controller";
import { SecurityMiddleware } from "../security/security.middleware";


export class CalendarRouter {
    private router: express.Router = express.Router();
    private controller: CalendarController = new CalendarController();

    
    public getRouter(): express.Router {
        this.router.get("/", this.controller.getCalendars);
        this.router.get("/:id", this.controller.getCalendar);
        this.router.post("/", this.controller.postAddCalendar);
        this.router.put("/:id", this.controller.putUpdateCalendar);
        this.router.delete("/:id", this.controller.deleteCalendar);
        return this.router;
    }
}