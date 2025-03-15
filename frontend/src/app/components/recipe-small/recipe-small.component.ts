import { Component, Input } from '@angular/core';
import { RecipeModel } from '../../models/recipes.model'; // Adjust the path as necessary
import { MatCardModule } from '@angular/material/card';
import { RatingComponent } from '../rating/rating.component';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-recipe-small',
  standalone: true,
  imports: [MatCardModule, RatingComponent, CommonModule],
  templateUrl: './recipe-small.component.html',
  styleUrls: ['./recipe-small.component.scss']
})
export class RecipeSmallComponent {
  @Input() recipe!: RecipeModel;

  constructor(private router: Router, private recipeService: RecipeService) { }

  navigateToRecipe(): void {
    this.router.navigate(['/recipe', this.recipe._id]);
  }

  toggleFavorite(event: MouseEvent): void {
    event.stopPropagation(); // Don't trigger the click event

    // Update UI immediately
    this.recipe.favorite = !this.recipe.favorite;

    // Update the favorite status in the database
    const updatedRecipe = { ...this.recipe, favorite: this.recipe.favorite };

    if (this.recipe._id) {
      this.recipeService.updateRecipe(this.recipe._id, updatedRecipe).catch((err) => {
        console.error('Failed to update favorite status', err);
        // Revert the change if the update fails
        this.recipe.favorite = !this.recipe.favorite;
      });
    }
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  updateRating(newRating: number): void {
    console.log('Updating rating to', newRating);
    // Update UI immediately
    this.recipe.rating = newRating;

    // Update the rating in the database
    const updatedRecipe = { ...this.recipe, rating: this.recipe.rating };

    if (this.recipe._id) {
      this.recipeService.updateRecipe(this.recipe._id, updatedRecipe).catch((err) => {
        console.error('Failed to update rating', err);
        // Revert the change if the update fails
        this.recipe.rating = newRating; // Revert to the old rating if update fails
      });
    }
  }
}