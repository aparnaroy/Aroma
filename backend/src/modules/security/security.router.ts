import express from "express";
import { SecurityController } from "./security.controller";
import { SecurityMiddleware } from "./security.middleware";

/* SecurityRouter
    * @class: SecurityRouter
    * @remarks: A class that contains the routes for the security module
    * 			  getRouter: a function that returns a router object
    */
export class SecurityRouter {
    private router: express.Router = express.Router();
    private controller: SecurityController = new SecurityController();

    // Creates the routes for this router and returns a populated router object
    /* getRouter(): express.Router
        @returns {express.Router}
        @remarks: creates the routes for this router
    */
    public getRouter(): express.Router {
        this.router.get("/authorize", [SecurityMiddleware.validateUser], this.controller.authorize);
        this.router.post("/login", this.controller.postLogin);
        this.router.post("/register", this.controller.postRegister);
        this.router.get("/user", [SecurityMiddleware.validateUser], this.controller.getUser);
        this.router.get("/user/tags", [SecurityMiddleware.validateUser], this.controller.getTags);
        this.router.put("/user/password", [SecurityMiddleware.validateUser], this.controller.putUserPassword);
        this.router.put("/user/:id", [SecurityMiddleware.validateUser, SecurityMiddleware.isUser], this.controller.putUser);
        this.router.delete("/user/:id", [SecurityMiddleware.validateUser, SecurityMiddleware.isUser], this.controller.deleteUser);
        this.router.get("/tag/:id", [SecurityMiddleware.validateUser], this.controller.getTag);
        this.router.post("/tag", [SecurityMiddleware.validateUser], this.controller.postTag);
        this.router.put("/tag/:id", [SecurityMiddleware.validateUser], this.controller.putTag);
        this.router.delete("/tag/:id", [SecurityMiddleware.validateUser], this.controller.deleteTag);
        return this.router;
    }
}