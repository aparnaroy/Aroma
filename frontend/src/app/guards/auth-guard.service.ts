import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from '@angular/router';
import { LoginService } from '../services/login.service';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {
  private jwtHelper = new JwtHelperService();

  constructor(private _loginSvc: LoginService, private _router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {
    return new Promise((resolve, reject) => {
      const token = this._loginSvc.getToken();
      if (token && !this.jwtHelper.isTokenExpired(token)) {
        resolve(true);
      } else {
        this._loginSvc.authorize().then((isAuthorized) => {
          if (isAuthorized) {
            resolve(true);
          } else {
            this._router.navigate(['/login']);
            resolve(false);
          }
        }).catch((err) => {
          console.error(err);
          this._router.navigate(['/login']);
          resolve(false);
        });
      }
    });
  }
}