import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CalendarModel } from '../models/calendar.model';
import { Config } from '../config';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private cache: { [key: string]: any } = {};

  constructor(private httpClient: HttpClient) { }
  

  private clearCache(): void {
    Object.keys(this.cache).forEach((key) => {
      if (key.startsWith('recipes_')) {
        delete this.cache[key];
      }
    });
  }

  /*public getBlankRecipe(): RecipeModel {
    return {
      name: '',
      source: '',
      favorite: false,
      description: '',
      instructions: [],
      ingredients: [],
      tags: [],
      image: '',
      rating: 0,
      comments: '',
    };
  }*/

  /*public getRecipeCount(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.httpClient.get<{ count: number }>(`${Config.apiBaseUrl}/recipes/count`).subscribe({
        next: (data) => {
          resolve(data.count);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }*/

  public getRecipe(id: string): Promise<CalendarModel> {
    const cacheKey = `calendar_${id}`;
    if (this.cache[cacheKey]) {
      return Promise.resolve(this.cache[cacheKey]);
    }

    return new Promise<CalendarModel>((resolve, reject) => {
      this.httpClient.get<CalendarModel>(`${Config.apiBaseUrl}/calendars/${id}`).subscribe({
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

  public getCalendars(page?: number, searchQuery?: string): Promise<CalendarModel[]> {
    let queryParams = '';
    /*if (page !== undefined) {
      const start = page * this.pageSize;
      const end = start + this.pageSize - 1;
      queryParams += `start=${start}&end=${end}`;
    }
    if (searchQuery) {
      queryParams += (queryParams ? '&' : '') + `search=${encodeURIComponent(searchQuery)}`;
    }*/
    const cacheKey = `recipes_${page || 'all'}_${searchQuery || 'none'}`;

    if (this.cache[cacheKey]) {
      return Promise.resolve(this.cache[cacheKey]);
    }

    return new Promise<CalendarModel[]>(async (resolve, reject) => {
      this.httpClient.get<CalendarModel[]>(`${Config.apiBaseUrl}/calendars/?${queryParams}`).subscribe({
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

  /*public deleteRecipe(id: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.httpClient.delete(`${Config.apiBaseUrl}/recipes/${id}`).subscribe({
        next: () => {
          // Remove the recipe from the cache
          delete this.cache[`recipe_${id}`];
          // Optionally, you can also clear the recipes list cache if needed
          Object.keys(this.cache).forEach(key => {
            if (key.startsWith('recipes_')) {
              delete this.cache[key];
            }
          });
          resolve();
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public updateRecipe(id: string, recipe: RecipeModel): Promise<RecipeModel> {
    return new Promise<RecipeModel>((resolve, reject) => {
      this.httpClient.put<RecipeModel>(`${Config.apiBaseUrl}/recipes/${id}`, recipe).subscribe({
        next: (data) => {
          // Clear the cache
          Object.keys(this.cache).forEach(key => {
            if (key.startsWith('recipes_')) {
              delete this.cache[key];
            }
          });
          resolve(data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public createRecipe(recipe: RecipeModel): Promise<RecipeModel> {
    return new Promise<RecipeModel>((resolve, reject) => {
      this.httpClient.post<RecipeModel>(`${Config.apiBaseUrl}/recipes`, recipe).subscribe({
        next: (data) => {
          // Clear the cache
          Object.keys(this.cache).forEach(key => {
            if (key.startsWith('recipes_')) {
              delete this.cache[key];
            }
          });
          resolve(data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }*/
}