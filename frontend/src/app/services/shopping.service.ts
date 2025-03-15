import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShoppingListModel } from '../models/shopping.model';
import { Config } from '../config';

@Injectable({
  providedIn: 'root'
})
export class ShoppingService {
  private cache: { [key: string]: any } = {};

  constructor(private httpClient: HttpClient) { }

  public get pageSize(): number {
    return Config.pageSize;
  }

  public updatePageSize(newPageSize: number): void {
    Config.pageSize = newPageSize;
    this.clearCache();
  }

  public clearCache(): void {
    Object.keys(this.cache).forEach((key) => {
      if (key.startsWith('shopping_')) {
        delete this.cache[key];
      }
    });
  }

  public getBlankShoppingList(): ShoppingListModel {
    return {
      _userId: '',
      name: '',
      items: [],
      _created: new Date(),
      _updated: new Date(),
    };
  }

  public async getShoppingListCount(searchQuery?: string): Promise<number> {
    let queryParams = '';
    if (searchQuery) {
      queryParams = `?search=${encodeURIComponent(searchQuery)}`;
    }

    try {
      const data = await this.httpClient.get<{ count: number }>(`${Config.apiBaseUrl}/shopping/count${queryParams}`).toPromise();
      if (data) {
        return data.count;
      } else {
        throw new Error('Failed to fetch shopping list count');
      }
    } catch (err) {
      throw err;
    }
  }

  public async getShoppingList(id: string): Promise<ShoppingListModel> {
    const cacheKey = `shoppingList_${id}`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    try {
      const data = await this.httpClient.get<ShoppingListModel>(`${Config.apiBaseUrl}/shopping/${id}`).toPromise();
      this.cache[cacheKey] = data;
      if (data) {
        return data;
      } else {
        throw new Error('Failed to fetch shopping list');
      }
    } catch (err) {
      throw err;
    }
  }

  public async getShoppingLists(page?: number, searchQuery?: string): Promise<ShoppingListModel[]> {
    let queryParams = '';
    if (page !== undefined) {
      const start = page * this.pageSize;
      const end = start + this.pageSize - 1;
      queryParams += `start=${start}&end=${end}`;
    }
    if (searchQuery) {
      queryParams += (queryParams ? '&' : '') + `search=${encodeURIComponent(searchQuery)}`;
    }
    const cacheKey = `shopping_${page || 'all'}_${searchQuery || 'none'}`;

    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    try {
      const data = await this.httpClient.get<ShoppingListModel[]>(`${Config.apiBaseUrl}/shopping/?${queryParams}`).toPromise();
      this.cache[cacheKey] = data;
      if (data) {
        return data;
      } else {
        throw new Error('Failed to fetch shopping lists');
      }
    } catch (err) {
      throw err;
    }
  }

  public async deleteShoppingList(id: string): Promise<void> {
    try {
      await this.httpClient.delete(`${Config.apiBaseUrl}/shopping/${id}`).toPromise();
      delete this.cache[`shopping_${id}`];
      Object.keys(this.cache).forEach(key => {
        if (key.startsWith('shopping_')) {
          delete this.cache[key];
        }
      });
    } catch (err) {
      throw err;
    }
  }

  public async updateShoppingList(id: string, shoppingList: ShoppingListModel): Promise<ShoppingListModel> {
    try {
      const data = await this.httpClient.put<ShoppingListModel>(`${Config.apiBaseUrl}/shopping/${id}`, shoppingList).toPromise();
      Object.keys(this.cache).forEach(key => {
        if (key.startsWith('shopping_')) {
          delete this.cache[key];
        }
      });
      if (data) {
        return data;
      } else {
        throw new Error('Failed to update shopping list');
      }
    } catch (err) {
      throw err;
    }
  }

  public async createShoppingList(shoppingList: ShoppingListModel): Promise<ShoppingListModel> {
    try {
      const data = await this.httpClient.post<ShoppingListModel>(`${Config.apiBaseUrl}/shopping`, shoppingList).toPromise();
      Object.keys(this.cache).forEach(key => {
        if (key.startsWith('shopping_')) {
          delete this.cache[key];
        }
      });
      if (data) {
        return data;
      } else {
        throw new Error('Failed to create shopping list');
      }
    } catch (err) {
      throw err;
    }
  }
}
