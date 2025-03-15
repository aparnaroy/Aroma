import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeSmallComponent } from './recipe-small.component';

describe('RecipeSmallComponent', () => {
  let component: RecipeSmallComponent;
  let fixture: ComponentFixture<RecipeSmallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeSmallComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipeSmallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
