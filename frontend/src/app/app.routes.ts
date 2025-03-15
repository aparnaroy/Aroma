import { Routes } from '@angular/router';
import { PublicComponent } from './pages/public/public.component';
import { AuthGuardService } from './guards/auth-guard.service';

export const routes: Routes = [
    { path: '', component: PublicComponent },
    { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
    { path: 'recipes', loadComponent: () => import('./pages/recipes/recipes.component').then(m => m.RecipesComponent), canActivate: [AuthGuardService] },
    { path: 'meals', loadComponent: () => import('./pages/meals/meals.component').then(m => m.MealsComponent), canActivate: [AuthGuardService] },
    { path: 'recipe/:id', loadComponent: () => import('./pages/recipe/recipe.component').then(m => m.RecipeComponent), canActivate: [AuthGuardService] },
    { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent), canActivate: [AuthGuardService] },
    { path: 'groceries', loadComponent: () => import('./pages/shopping/shopping.component').then(m => m.ShoppingComponent), canActivate: [AuthGuardService] },
];
