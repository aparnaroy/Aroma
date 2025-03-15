import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { Router } from '@angular/router';
import { Config } from '../config';
import { UserService } from './user.service';
import { EventEmitter } from '@angular/core';
import { RecipeService } from './recipe.service';
import { ShoppingService } from './shopping.service';

interface TokenResponseObject {
  token: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private tokenKey = 'authToken';
  userLoggedIn = new ReplaySubject<{ userId: string; userEmail: string }>(1);

  constructor(private httpClient: HttpClient, private router: Router, private userService: UserService, private recipeService: RecipeService, private shoppingService: ShoppingService) {
    this.loggedIn.next(this.userService.getToken().length > 0);
  }

  public get token(): string {
    return this.userService.getToken();
  }

  public set token(value: string) {
    this.loggedIn.next(value.length > 0);
    this.userService.setToken(value);
  }

  public removeToken(): void {
    localStorage.removeItem('token');
    this.loggedIn.next(false);
  }

  public loggedIn: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

  public async authorize(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.httpClient.get<TokenResponseObject>(Config.apiBaseUrl + '/security/authorize').subscribe({
        next: (response) => {
          this.token = response.token;
          resolve(response.token.length > 0);
        },
        error: (error) => {
          this.removeToken();
          this.router.navigate(['/login']); // Redirect to login page on error
          reject(error);
        }
      });
    });
  }

  public login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.httpClient.post<TokenResponseObject>(Config.apiBaseUrl + "/security/login", { username: username, password: password }).subscribe({
        next: (response) => {
          if (response.token && response.token.length > 0) {
            this.token = response.token
            const userId = response.userId || "";
            const userEmail = username;
            this.userLoggedIn.next({ userId, userEmail });
            resolve(true);
          } else {
            this.token = "";
            resolve(false);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  public logout(): void {
    this.removeToken();
    localStorage.clear();
    this.router.navigate(['/']);
    // clear all cached data
    this.userService.clearCache();
    this.recipeService.clearCache();
    this.shoppingService.clearCache();
  }

  public register(username: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.httpClient.post<TokenResponseObject>(Config.apiBaseUrl + "/security/register", { username: username, password: password }).subscribe({
        next: (response) => {
          if (response.token && response.token.length > 0) {
            this.token = response.token
            const userId = response.userId || "";
            const userEmail = username;
            this.userLoggedIn.next({ userId, userEmail });
            resolve(true);
          } else {
            this.token = "";
            resolve(false);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

}