import express from "express";
import { MongoDBService, ObjectId } from "../database/mongodb.service";
import { CalendarModel } from "./calendar.models";
import { CalendarSettings } from "./calendar.settings";


export class CalendarController {

    private mongoDBService: MongoDBService;
    private settings = new CalendarSettings();

    constructor() {
        this.mongoDBService = new MongoDBService();
    }

    
    getCalendars = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            let result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            let calendars = await this.mongoDBService.find<CalendarModel>(
                this.settings.database,
                this.settings.collection,
                { _userId: req.body.user._id } // only return calendars for the current user
            );
            res.send(calendars);
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    
    getCalendar = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            let result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            let calendar = await this.mongoDBService.findOne<CalendarModel>(this.settings.database, this.settings.collection, { _id: new ObjectId(req.params.id), _userId: req.body.user._id });
            if (!calendar) {
                res.status(404).send({ error: "Calendar not found" });
                return;
            }
            res.send(calendar);
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    
    postAddCalendar = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            let calendar: CalendarModel = {
                _userId: req.body.user._id,
                date: req.body.date || "Untitled",
                recipes: req.body.recipes,
                _created: new Date(),
                _updated: new Date(),
            };
            const success = await this.mongoDBService.insertOne(this.settings.database, this.settings.collection, calendar);
            if (success) {
                res.send({ success: true });
            } else {
                res.status(500).send({ error: "Failed to add calendar" });
            }
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    
    putUpdateCalendar = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            const calendarID = new ObjectId(req.params.id);
            let calendar: CalendarModel = {
                _userId: req.body.user._id,
                date: req.body.date || "Untitled",
                recipes: req.body.recipes,
                _created: new Date(),
                _updated: new Date(),
            };
            let command = { $set: calendar };
            const success = await this.mongoDBService.updateOne(this.settings.database, this.settings.collection, { _id: calendarID }, command);
            if (success) {
                res.send({ success: true });
            } else {
                res.status(500).send({ error: "Failed to update calendar" });
            }
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    
    deleteCalendar = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            const calendarID = new ObjectId(req.params.id);
            const calendar = await this.mongoDBService.findOne<CalendarModel>(this.settings.database, this.settings.collection, { _id: calendarID });
            if (!calendar) {
                res.status(404).send({ error: "Calendar not found" });
                return;
            }
            let success = await this.mongoDBService.insertOne(this.settings.database, this.settings.archiveCollection, calendar);
            if (!success) {
                res.status(500).send({ error: "Failed to archive calendar" });
                return;
            }
            success = await this.mongoDBService.deleteOne(this.settings.database, this.settings.collection, { _id: calendarID });
            if (!success) {
                res.status(500).send({ error: "Failed to delete calendar" });
                return;
            }
            res.send({ success: true });
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }
}