import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeComponent } from '../../pages/recipe/recipe.component';
import { RecipeService } from '../../services/recipe.service';
import { RecipeModel } from '../../models/recipes.model';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { FormControl, FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {AsyncPipe} from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RecipeSmallComponent } from '../recipe-small/recipe-small.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CalendarModel } from '../../models/calendar.model';
import { CalendarService } from '../../services/calendar.service';
import { HttpClient } from '@angular/common/http';
import { Config } from '../../config';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [RecipeSmallComponent, CommonModule, RecipeSmallComponent, MatInputModule, MatFormFieldModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatToolbarModule, MatMenuModule, MatCheckboxModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
  myControl = new FormControl('');
  public recipes: RecipeModel[] = [];
  public calendarDates: CalendarModel[] = [];
  filteredRecipes: RecipeModel[] = [];
  public checkedRecipes: RecipeModel[] = [];
  public allWeeklyRecipes: RecipeModel[] = [];
  public currentDayID: string = '';
  public loading = false;

  //public date: new Date();

  constructor(private router: Router, private recipeSvc: RecipeService, private calendarSvc: CalendarService, private httpClient: HttpClient) {
    this.createCalendar();
    //this.addRecipe();
    this.loadRecipes();
    this.filteredRecipes = this.recipes;
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      // Fetch the recipes for the current page (pageIndex and pageSize)
      this.recipes = await this.recipeSvc.getRecipes();
      this.calendarDates = await this.calendarSvc.getCalendars();
  
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async loadRecipes() {
    this.recipes = await this.recipeSvc.getRecipes();
    this.calendarDates = await this.calendarSvc.getCalendars();
    this.loadCalendarEntries();
  }

  loadCalendarEntries() {
    for (let i = 0; i < this.calendarDates.length; i++) {
      const date = this.calendarDates[i].date;
      if (date) {
        const weekDay = document.getElementById(date);
        for (let j = 0; j < this.calendarDates[i].recipes.length; j++) {
          const recipeToAdd = document.createElement('div');
          const removeButton = document.createElement('button');
          removeButton.textContent = 'x';
          removeButton.className = 'remove-recipe-btn';
          recipeToAdd.className = 'recipe-item';

          removeButton.addEventListener('click', () => {
            recipeToAdd.remove(); // Remove the element from the DOM
          });

          recipeToAdd.addEventListener('click', () => {
            console.log("recipe clicked!!!!");
            if (this.calendarDates[i]?.recipes[j]?.recipe?._id) {
              console.log("hello?");
              this.router.navigate(['/recipe', this.calendarDates[i].recipes[j].recipe._id]);
            }
          })

          recipeToAdd.innerHTML = this.calendarDates[i].recipes[j].recipeName;
          recipeToAdd.append(removeButton);
          weekDay?.append(recipeToAdd);
        }
        
      }
    }
  }

  addCheckedRecipes() {
    const dayID = this.currentDayID;
    const element = document.getElementById(dayID);
    //let daysRecipes: RecipeModel[] = [];
    let daysRecipes: {recipeID: number; recipeName: string; recipe: RecipeModel}[] = [];
    let numRecipes = 0;
    const now = new Date();
    const day = now.getDate();
    console.log(day);
    
    for (let i = 0; i < this.checkedRecipes.length; i++) {
      //const newCalendarEntry = await this.recipeSvc.getRecipe(dayID); 
      const newRecipe = document.createElement('div');
      newRecipe.className = 'recipe-item'; 

      const recipeText = document.createElement('span');
        recipeText.textContent = this.checkedRecipes[i].name;

      // add delete button for 
      const removeButton = document.createElement('button');
      removeButton.textContent = 'x';
      removeButton.className = 'remove-recipe-btn';

      // handle exit button
      removeButton.addEventListener('click', () => {
        newRecipe.remove(); // Remove the element from the DOM
        
        // Remove the recipe from daysRecipes and allWeeklyRecipes if necessary
        //daysRecipes = daysRecipes.filter(recipe => recipe.recipeName !== recipeName);
        //this.allWeeklyRecipes = this.allWeeklyRecipes.filter(recipe => recipe.name !== recipeName);
      });

      newRecipe.append(recipeText);
      newRecipe.append(removeButton);
      element?.append(newRecipe);
      daysRecipes.push({recipeID: numRecipes, recipeName: this.checkedRecipes[i].name, recipe: this.checkedRecipes[i]});
      numRecipes++;
      this.allWeeklyRecipes.push(this.checkedRecipes[i]);
    }

    console.log(this.checkedRecipes[0].ingredients[0]);
    // backend call

    const calendarEntry = {
      date: dayID,
      recipes: daysRecipes,
      _created: new Date(),
      _updated: new Date(),
    }

    this.httpClient.post<{ success: boolean, calendarID: string }>(`${Config.apiBaseUrl}/calendars`, calendarEntry).subscribe({
      next: async (response) => {
          
          if (response.success) { // && && response.calendarID
              //await this.onRecipeCreated(response.recipeId);  // Wait until the recipe is created
              //this.router.navigate([`/recipe/${response.recipeId}`]);  // Navigate to the new recipe page
              await this.loadData();
              console.log("completed post successfully");
              for (let i = 0; i < this.calendarDates.length; i++) {
                for (let j = 0; j < this.calendarDates[i].recipes.length; j++) {
                  console.log("data entry: " + this.calendarDates[i].recipes[j].recipeName);
                  console.log("data entry date: " + this.calendarDates[i].date);
                  if (this.calendarDates[i].recipes[j].recipe && this.calendarDates[i].recipes[j].recipe.name && this.calendarDates[i].recipes[j].recipe.ingredients) {
                  
                    console.log(this.calendarDates[i].recipes[j].recipe.ingredients[0].name);
                  }
                  /*if (this.calendarDates[i].recipes[j].recipe.ingredients && this.calendarDates[i].recipes[j].recipe.ingredients.length > 0) {
                    console.log("data ingredients " + this.calendarDates[i].recipes[j].recipe.ingredients[0].name);
                  }*/
                }
              }
              console.log("data entries number: " + this.calendarDates.length);
            } else {
              console.error('Recipe generation failed');
              //this.showError('Recipe generation failed');
          }

          //resolve();
      },
      error: (err) => {
          console.error('Failed to generate recipe:', err);
          //this.isLoading = false; // Stop loading on error
          //clearInterval(this.messageChangeInterval); // Stop changing messages on error
          //this.showError('Failed to generate recipe.');
          //this.currentMessageIndex = 0;
          //reject(err);
      }
  });
    
    numRecipes = 0;
    this.closeWindow();
  }

  addRecipe(dayID: string) {
    this.recipeToAdd();
    this.currentDayID = dayID;
    const recipeGrid = document.getElementById("recipe-grid");
    if (recipeGrid) {
      recipeGrid.style.visibility = "hidden";
    }
    const element = document.getElementById(dayID);
    if (element) {
      console.log("element exists");
      const recipes = document.createElement('div');
      
      for (let i = 0; i < this.checkedRecipes.length; i++) {
        recipes.innerHTML = this.checkedRecipes[i].name;
        console.log(this.checkedRecipes[i].name);
      }
      element.append(recipes);
    }  
  }

  filterResults(text: string) {
    const recipeGrid = document.getElementById("recipe-grid");
    if (recipeGrid) {
      recipeGrid.style.visibility = "visible";
    }
    console.log(text);
    if (!text) {
      this.filteredRecipes = this.recipes;
      return;
    }

    this.filteredRecipes = this.recipes.filter(
      recipe => recipe?.name.toLowerCase().includes(text.toLowerCase())
    );
  }

  generateGroceryList() {
    console.log("clicked grocery list");
    const groceryList = document.getElementById("grocery-list");
    if (groceryList) {
      groceryList.style.display = "block";
    }

    const ingredients = [];
    this.loadData();
    for (let i = 0; i < this.calendarDates.length; i++) {
      for (let j = 0; j < this.calendarDates[i].recipes.length; j++) {
        if (this.calendarDates[i].recipes[j].recipe && this.calendarDates[i].recipes[j].recipe.name && this.calendarDates[i].recipes[j].recipe.ingredients) {

          for (let k = 0; k < this.calendarDates[i].recipes[j].recipe.ingredients.length; k++) {
            console.log("reached inner inner list");
            const ingredient = document.createElement('div');
            ingredient.innerHTML = this.calendarDates[i].recipes[j].recipe.ingredients[k].quantity.toString() + " " + this.calendarDates[i].recipes[j].recipe.ingredients[k].unitOfMeasure + " " + this.calendarDates[i].recipes[j].recipe.ingredients[k].name;
            groceryList?.append(ingredient);
            
          }
        }
        

      }
    }
    /*for (let i = 0; i < this.allWeeklyRecipes.length; i++) {
      for (let k = 0; k < this.allWeeklyRecipes[i].ingredients.length; k++) {
        const ingredient = document.createElement('div');
        ingredient.innerHTML = this.allWeeklyRecipes[i].ingredients[k].quantity.toString() + " " + this.allWeeklyRecipes[i].ingredients[k].unitOfMeasure + " " + this.allWeeklyRecipes[i].ingredients[k].name;
        groceryList?.append(ingredient);
        //console.log(this.allWeeklyRecipes[i].ingredients[k].quantity.toString() + " " + this.allWeeklyRecipes[i].ingredients[k].unitOfMeasure + " " + this.allWeeklyRecipes[i].ingredients[k].name);
        //ingredients.push(this.allWeeklyRecipes[i].ingredients[k].name);
        console.log("there exist weekly recipes");
      }
    }*/
    console.log("after clicking list : there exist no weekly recipes " + this.allWeeklyRecipes.length);
  }

  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      const inputBox = event.target as HTMLInputElement;
      inputBox.disabled = true; // Disable the input box
      const inputValue = inputBox.value;
      this.filterResults(inputValue);
    }
  }

  clearInput() {
    const inputBox = document.getElementById('input-box') as HTMLInputElement;
    if (inputBox) {
      inputBox.value = '';
      inputBox.disabled = false;
    }
    const recipeGrid = document.getElementById("recipe-grid");
    if (recipeGrid) {
      recipeGrid.style.visibility = "hidden";
    }
  }

  closeWindow() {
    const selectionScreen = document.getElementById('selection-screen');
    const popupScreen = document.getElementById('popup-box');
    const inputBox = document.getElementById('input-box') as HTMLInputElement;
    if (inputBox) {
      inputBox.value = '';
      inputBox.disabled = false;
    }
    const recipeGrid = document.getElementById("recipe-grid");
    if (recipeGrid) {
      recipeGrid.style.visibility = "hidden";
    }
    if (selectionScreen && popupScreen) {
    selectionScreen.style.visibility = 'hidden';
    selectionScreen.style.pointerEvents = 'none';

    popupScreen.style.visibility = 'hidden';
    popupScreen.style.pointerEvents = 'none';
    }
    this.checkedRecipes = [];
    this.currentDayID = '';
    this.filteredRecipes = [];
  }

  onCheckboxChange(recipe: RecipeModel, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.checkedRecipes.push(recipe);
      console.log(`checked: ${recipe.name}`)
    }
  }

  recipeToAdd(): RecipeModel[] | null {
    const selectionScreen = document.getElementById('selection-screen');
    const popupScreen = document.getElementById('popup-box');
      if (selectionScreen && popupScreen) {
    selectionScreen.style.visibility = 'visible';
    selectionScreen.style.pointerEvents = 'all';

    popupScreen.style.visibility = 'visible';
    popupScreen.style.pointerEvents = 'all';
    }
    return null;
  }




  createCalendar() {
    const calendarBlock = document.getElementById('calendar-contents');
    const parent = document.createElement('div');
    parent.className = 'grid';
    calendarBlock?.appendChild(parent);
    console.log("appended paretn");
    
    for (var i = 0; i < 10; i++) {
      const day = document.createElement('div');
      day.className = 'calendar-day';
      day.textContent = 'day1';
      parent.appendChild(day);
    }
    //document.body.appendChild(parent);
    //calendarBlock?.appendChild(parent);
  }

}
