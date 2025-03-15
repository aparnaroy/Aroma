import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RecipeModel } from '../models/recipes.model';
import { Config } from '../config';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private cache: { [key: string]: any } = {};

  constructor(private httpClient: HttpClient) { }

  public get pageSize(): number {
    return Config.pageSize;
  }

  public updatePageSize(newPageSize: number): void {
    Config.pageSize = newPageSize; // Update the pageSize in Config
    this.clearCache();
  }

  public clearCache(): void {
    Object.keys(this.cache).forEach((key) => {
      if (key.startsWith('recipes_')) {
        delete this.cache[key];
      }
    });
  }

  public getBlankRecipe(): RecipeModel {
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
  }

  public getRecipeCount(searchQuery?: string): Promise<number> {
    let queryParams = '';
    if (searchQuery) {
      queryParams = `?search=${encodeURIComponent(searchQuery)}`;
    }

    return new Promise<number>((resolve, reject) => {
      this.httpClient.get<{ count: number }>(`${Config.apiBaseUrl}/recipes/count${queryParams}`).subscribe({
        next: (data) => {
          resolve(data.count);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  public getRecipe(id: string): Promise<RecipeModel> {
    const cacheKey = `recipe_${id}`;
    if (this.cache[cacheKey]) {
      return Promise.resolve(this.cache[cacheKey]);
    }

    return new Promise<RecipeModel>((resolve, reject) => {
      this.httpClient.get<RecipeModel>(`${Config.apiBaseUrl}/recipes/${id}`).subscribe({
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

  public getRecipes(page?: number, searchQuery?: string): Promise<RecipeModel[]> {
    let queryParams = '';
    if (page !== undefined) {
      const start = page * this.pageSize;
      const end = start + this.pageSize - 1;
      queryParams += `start=${start}&end=${end}`;
    }
    if (searchQuery) {
      queryParams += (queryParams ? '&' : '') + `search=${encodeURIComponent(searchQuery)}`;
    }
    const cacheKey = `recipes_${page || 'all'}_${searchQuery || 'none'}`;

    if (this.cache[cacheKey]) {
      return Promise.resolve(this.cache[cacheKey]);
    }

    return new Promise<RecipeModel[]>(async (resolve, reject) => {
      this.httpClient.get<RecipeModel[]>(`${Config.apiBaseUrl}/recipes/?${queryParams}`).subscribe({
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

  public deleteRecipe(id: string): Promise<void> {
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
    if (recipe.tags === undefined || recipe.tags === null || recipe.tags.length === 0) {
      recipe.tags = [];
    }
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
    if (recipe.tags === undefined || recipe.tags === null || recipe.tags.length === 0) {
      recipe.tags = [];
    }
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
  }
}