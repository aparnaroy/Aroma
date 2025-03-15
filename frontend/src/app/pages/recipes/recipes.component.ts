import { Component, HostListener } from '@angular/core';
import { RecipeSmallComponent } from '../../components/recipe-small/recipe-small.component';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RecipeModel } from '../../models/recipes.model';
import { RecipeService } from '../../services/recipe.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatListOption } from '@angular/material/list';

import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { HttpClient } from '@angular/common/http';
import { Config } from '../../config';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, RecipeSmallComponent, MatPaginatorModule, MatInputModule, MatFormFieldModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule, MatToolbarModule, MatMenuModule, MatCheckboxModule, MatChipsModule, MatRadioModule, MatCheckboxModule],
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss']
})
export class RecipesComponent {
  public recipes: RecipeModel[] = [];
  public tags: { _id: string; name: string; selected: boolean }[] = [];
  public recipesCount: number = 0;
  public pageIndex: number = 0;
  public searchQuery: string = '';
  public filterQuerry: string = '';
  public gridTemplateColumns: string = this.getGridCols();
  public loading: boolean = true;
  public isMenuVisible: boolean = false;
  public isModalVisible: boolean = false;
  public recipeUrl: string = '';
  public isLoading: boolean = false;
  public loadingMessages: string[] = [
    'Extracting recipe from website...',
    'Parsing recipe data with AI...',
    'Analyzing ingredients...',
    'Inspecting instructions...',
    'Grabbing a scrumptious image...',
    'Finalizing recipe details...',
    'Generating recipe description...',
    'Recipe import almost done...',
    'Cooking up a storm...',
    'Serving up your recipe...',
    'Bon appétit!',
    'Enjoy your meal!'
  ];
  currentMessageIndex: number = 0;
  messageChangeInterval: any;
  errorMessage: string | null = null;
  isErrorMessageVisible = false;
  isGenerateModalVisible = false;
  ingredientInput: string = '';
  ingredients: string[] = [];
  ingredientControl = new FormControl();

  // Shown options
  cuisines = ['Italian', 'Mexican', 'Indian', 'Chinese', 'French'];
  otherCuisine = '';
  mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
  cookTimes = ['< 15 minutes', '15-30 minutes', '30-60 minutes', '> 1 hour'];
  equipmentList = ['Stove', 'Oven', 'Microwave', 'Blender', 'Instant Pot', 'Wok', 'Cast Iron Skillet'];
  otherSpecifications: string = '';

  // Selected option values
  selectedCuisine: string = 'any';
  selectedMealType: string = 'any';
  selectedCookTime: string = 'any';
  selectedEquipment: { [key: string]: boolean } = {}; // All equipment options are initially selected

  public generationLoadingMessages: string[] = [
    'Cooking up a magical recipe...',
    'Stirring together the perfect ingredients...',
    'Adding a dash of creativity...',
    'Spicing things up...',
    'Letting the flavors melt together...',
    'Generating recipe description...',
    'Finalizing recipe details...',
    'Recipe generation almost done...',
    'Serving up your recipe...',
    'Secret chefs at work—your recipe is almost done!',
    'Bon appétit!',
    'Enjoy your meal!'
  ];


  public get pageSize(): number {
    return this.recipeSvc.pageSize;
  }

  constructor(private recipeSvc: RecipeService, private userSvc: UserService, private router: Router, private httpClient: HttpClient) {
    this.loadData();
    console.log('RecipesComponent constructor: loaded data');
    this.updateGridCols();

    this.equipmentList.forEach(equipment => {
      this.selectedEquipment[equipment] = true;
    });
  }

  // async loadData(): Promise<void> {
  //   this.loading = true;
  //   try {
  //     this.recipes = await this.recipeSvc.getRecipes(this.pageIndex, this.searchQuery);
  //     const tags = await this.userSvc.getTags();
  //     this.tags = tags.map(tag => ({ ...tag, selected: false }));
  //     this.recipesCount = this.recipes.length;
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     this.loading = false;
  //   }
  // }
  async loadData(): Promise<void> {
    this.loading = true;
    try {
      // Fetch the recipes for the current page (pageIndex and pageSize)
      this.recipes = await this.recipeSvc.getRecipes(this.pageIndex, this.searchQuery || this.filterQuerry);

      if (this.tags.length === 0) {
        const tags = await this.userSvc.getTags();
        this.tags = tags.map(tag => ({ ...tag, selected: false }));
        // Adds a favorite tag to the tags list only on page load
        this.tags.unshift({ _id: '', name: 'Favorite', selected: false });
      }
      // Fetch the total count of recipes (this would be a separate call)
      const count = await this.recipeSvc.getRecipeCount();
      this.recipesCount = count; // Set the total count of recipes for pagination
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async onRecipeCreated(newRecipeId: string): Promise<void> {
    try {
      const newRecipe = await this.recipeSvc.getRecipe(newRecipeId);

      if (newRecipe) {
        // Increment the total count of recipes
        this.recipesCount += 1;
    
        // Add the new recipe to the top of the current page
        this.recipes.unshift(newRecipe);
    
        // Check if the number of recipes exceeds the page size
        if (this.recipes.length > this.pageSize) {
            // If it does, remove the last recipe to maintain the page size limit
            this.recipes.pop();
        }
    
        // If the current page is not the first page, reset to the first page to ensure the new recipe is visible
        if (this.pageIndex > 0) {
            this.pageIndex = 0;
            await this.loadData();
        }
      }
    } catch (err) {
      console.error('Failed to fetch the new recipe:', err);
      this.showError('Failed to fetch the new recipe');
    }
  }

  async applyFilters(): Promise<void> {
    const selectedTags = this.tags.filter(tag => tag.selected).map(tag => tag.name);
    this.filterQuerry = selectedTags.length > 0 ? `tags:${selectedTags.join(',')}` : '';
    this.pageIndex = 0;
    await this.loadData();
    await this.updateRecipeCount();
  }

  async updateRecipeCount(): Promise<void> {
    try {
      this.recipesCount = await this.recipeSvc.getRecipeCount(this.searchQuery || this.filterQuerry);
    } catch (err) {
      console.error(err);
    }
  }

  async clearFilters(): Promise<void> {
    this.tags.forEach(tag => tag.selected = false);
    this.filterQuerry = '';
    this.pageIndex = 0;
    await this.loadData();
    await this.updateRecipeCount();
  }

  handlePageEvent(event: PageEvent) {
    // Update the page size dynamically
    this.recipeSvc.updatePageSize(event.pageSize);

    // Update the current page index
    this.pageIndex = event.pageIndex;

    // Reload recipes with the updated page size
    this.loadData();
  }

  async loadRecipes(): Promise<void> {
    this.recipes = await this.recipeSvc.getRecipes(this.pageIndex, this.searchQuery || this.filterQuerry);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateGridCols();
  }

  getGridCols(): string {
    const cols = window.innerWidth < 735 ? 1 : window.innerWidth < 1090 ? 2 : window.innerWidth < 1444 ? 3 : 4;
    return `repeat(${cols}, 1fr)`;
  }

  updateGridCols() {
    this.gridTemplateColumns = this.getGridCols();
  }

  addRecipe(): void {
    this.router.navigate(['/recipe/new']);
  }

  importRecipe(): void {
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
    this.recipeUrl = ''; // Clear the input box
    clearInterval(this.messageChangeInterval); // Stop changing messages after closing modal
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.isErrorMessageVisible = true;

    setTimeout(() => {
      this.closeErrorMessage();
    }, 3000);
  }

  closeErrorMessage(): void {
    console.log('Closing error message');
    const errorElement = document.querySelector('.error-message');
    if (errorElement) {
      errorElement.classList.add('fade-out'); // Start fade-out animation

      // Use a timeout to reset the state after the animation duration
      setTimeout(() => {
        this.isErrorMessageVisible = false;
        this.errorMessage = null;
        errorElement.classList.remove('fade-out'); // Reset the class for future animations
      }, 500);
    } else {
      this.isErrorMessageVisible = false;
      this.errorMessage = null;
    }
  }

  importRecipeFromUrl(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.recipeUrl) {
        const error = new Error('No URL entered');
        console.error(error.message);
        this.showError('No URL entered');
        reject(error);
        return;
      }

      // Set loading state
      this.isLoading = true;
      this.startMessageCycle(this.loadingMessages, 4000); // Start changing messages every few seconds

      this.httpClient.post<{ success: boolean, _id: string }>(`${Config.apiBaseUrl}/recipes/extract`, { url: this.recipeUrl }).subscribe({
        next: async (response) => {
          this.closeModal(); // Close the modal after successful import

          // Navigate to the newly created recipe's page using the recipe's _id
          if (response.success && response._id) {
            await this.onRecipeCreated(response._id);  // Wait until the recipe is created
            this.router.navigate([`/recipe/${response._id}`]);  // Then navigate to new recipe page
          } else {
            console.error('Recipe creation failed');
            this.showError('Recipe creation failed');
          }

          resolve();
        },
        error: (err) => {
          console.error('Failed to import recipe:', err);
          this.isLoading = false; // Stop loading on error
          clearInterval(this.messageChangeInterval); // Stop changing messages on error
          this.showError('Failed to import recipe.');
          this.closeModal();
          this.currentMessageIndex = 0;
          reject(err);
        }
      });
    });
  }

  // Start changing the loading message every few seconds
  startMessageCycle(messages: string[], timeInterval: number): void {
    this.messageChangeInterval = setInterval(() => {
      this.currentMessageIndex = (this.currentMessageIndex + 1) % messages.length;
    }, timeInterval); // Change message every 4 seconds
  }

  async onSearch(event?: KeyboardEvent): Promise<void> {
    if (!event || event.key === 'Enter') {
      this.pageIndex = 0;
      await this.loadData();
      await this.updateRecipeCount();
    }
  }

  // If touchscreen device, show menu on click
  // If not touchscreen device, show menu on hover and add recipe on click
  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    const target = event.target as HTMLElement;
    const addButton = target.closest('.add-recipe-button') as HTMLElement;

    if (addButton) {
      if (this.isTouchDevice()) {
        this.isMenuVisible = !this.isMenuVisible;
      } else {
        console.log('Add recipe');
        this.importRecipe();  // Default click on add button
      }
    }
    // console.log('isTouchDevice:', this.isTouchDevice());
  }

  isTouchDevice(): boolean {
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }

  async filterByTag(tag: string): Promise<void> {
    this.searchQuery = tag;
    this.pageIndex = 0;
    await this.loadData();
    await this.updateRecipeCount();
  }

  // Open the generate recipe modal
  openGenerateModal() {
    this.isGenerateModalVisible = true;
  }

  closeGenerateModal() {
    this.isGenerateModalVisible = false;
    this.ingredients = [];  // Clear all the chips
    this.ingredientInput = '';  // Reset ingredient input

    // Reset selected values to their default values
    this.selectedCuisine = 'any';
    this.selectedMealType = 'any';
    this.selectedCookTime = 'any';

    // Reset the equipment selections
    this.equipmentList.forEach(equipment => {
      this.selectedEquipment[equipment] = true;
    });

    // Clear out any other specifications
    this.otherCuisine = '';
    this.otherSpecifications = '';

    this.isLoading = false;  // Stop loading
    clearInterval(this.messageChangeInterval);
  }


  // Add ingredient to the ingredients list
  addIngredient() {
    if (this.ingredientInput) {
      // Split the input by commas and trim spaces
      const newIngredients = this.ingredientInput.split(',')
        .map(ingredient => ingredient.trim().toLowerCase())
        .filter(ingredient => ingredient.length > 0); // Filter out any empty ingredients

      // Add only unique ingredients
      newIngredients.forEach(ingredient => {
        if (!this.ingredients.includes(ingredient)) {
          this.ingredients.push(ingredient);
        } else {
          this.showError("Ingredient already added");
        }
      });

      this.ingredientInput = '';
    }
  }

  // Remove ingredient from the ingredients list
  removeIngredient(ingredient: string) {
    const index = this.ingredients.indexOf(ingredient);
    if (index >= 0) {
      this.ingredients.splice(index, 1);
    }
  }

  onEnter(event: any): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      (event.target as HTMLInputElement).blur(); // Remove focus from the input field
    }
  }

  // Generate recipe
  generateRecipe(): Promise<void> {
    this.selectedCuisine = this.selectedCuisine === 'other' ? this.otherCuisine.toLowerCase() : this.selectedCuisine;

    return new Promise<void>((resolve, reject) => {
      // Set loading state
      this.isLoading = true;
      this.startMessageCycle(this.generationLoadingMessages, 3000); // Start changing messages every few seconds

      // Prepare the request payload
      const requestPayload = {
        ingredients: this.ingredients,
        cuisine: this.selectedCuisine,
        mealType: this.selectedMealType,
        cookTime: this.selectedCookTime,
        equipment: this.selectedEquipment,
        otherSpecifications: this.otherSpecifications
      };

      // Make the POST request to the backend to generate the recipe
      this.httpClient.post<{ success: boolean, _id: string }>(`${Config.apiBaseUrl}/recipes/generate`, requestPayload).subscribe({
        next: async (response) => {
          this.closeGenerateModal();

          if (response.success && response._id) {
            await this.onRecipeCreated(response._id);  // Wait until the recipe is created
            this.router.navigate([`/recipe/${response._id}`]);  // Navigate to the new recipe page
          } else {
            console.error('Recipe generation failed');
            this.showError('Recipe generation failed');
          }

          resolve();
        },
        error: (err) => {
          console.error('Failed to generate recipe:', err);
          this.isLoading = false; // Stop loading on error
          clearInterval(this.messageChangeInterval); // Stop changing messages on error
          this.showError('Failed to generate recipe.');
          this.closeGenerateModal();
          this.currentMessageIndex = 0;
          reject(err);
        }
      });
    });
  }
}