import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserLoginModel } from '../models/user.model';
import { Config } from '../config';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private cache: { [key: string]: any } = {};
  private token: string = '';

  constructor(private httpClient: HttpClient) {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      this.token = storedToken;
    }
  }

  public clearCache(): void {
    Object.keys(this.cache).forEach((key) => {
      if (key.startsWith('user_')) {
        delete this.cache[key];
      }
    }
    );
  }

  public getUser(id: string): Promise<UserLoginModel> {
    const cacheKey = `user_${id}`;
    if (this.cache[cacheKey]) {
      return Promise.resolve(this.cache[cacheKey]);
    }

    return new Promise<UserLoginModel>((resolve, reject) => {
      this.httpClient.get<UserLoginModel>(`${Config.apiBaseUrl}/security/user`).subscribe({
        next: (data) => {
          this.cache[cacheKey] = data;
          resolve(data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public updateUser = (id: string, user: UserLoginModel): Promise<UserLoginModel> => {
    return new Promise<UserLoginModel>((resolve, reject) => {
      this.httpClient.put<{ user: UserLoginModel, token: string }>(`${Config.apiBaseUrl}/security/user/${user._id}`, user).subscribe({
        next: (response) => {
          // Clear the cache
          delete this.cache[`user_${id}`];
          // Save the new token
          this.setToken(response.token);
          resolve(response.user);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public changePassword = (currentPassword: string, newPassword: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      this.httpClient.put<{ token: string }>(`${Config.apiBaseUrl}/security/user/password`, { currentPassword, newPassword }).subscribe({
        next: (response) => {
          this.setToken(response.token);
          resolve();
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public getToken = (): string => {
    return this.token;
  }

  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  public getTags = (): Promise<{ _id: string; name: string; }[]> => {
    return new Promise<{ _id: string; name: string; }[]>((resolve, reject) => {
      this.httpClient.get<{ _id: string; name: string; }[]>(`${Config.apiBaseUrl}/security/user/tags`).subscribe({
        next: (data) => {
          resolve(data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }
}
