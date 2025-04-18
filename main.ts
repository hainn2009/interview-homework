import { GetRecipes, GetBaseUoM, GetProductsForIngredient } from "./supporting-files/data-access";
import { ExpectedRecipeSummary, RunTest } from "./supporting-files/testing";
import { ConvertUnits, GetCostPerBaseUnit, GetNutrientFactInBaseUnits, SumUnitsOfMeasure } from "./supporting-files/helpers";
import { UoMType, NutrientFact, UoMName } from "./supporting-files/models";

console.clear();
console.log("Expected Result Is:", ExpectedRecipeSummary);

const recipeData = GetRecipes(); // the list of 1 recipe you should calculate the information for
console.log("Recipe Data:", recipeData);
const recipeSummary: any = {}; // the final result to pass into the test function
/*
 * YOUR CODE GOES BELOW THIS, DO NOT MODIFY ABOVE
 * (You can add more imports if needed)
 * */
for (const recipe of recipeData) {
    let cheapestCost = 0;

    const getInitializeNutrientFact = (nutrientName: string): NutrientFact => ({
        nutrientName,
        quantityAmount: {
            uomAmount: 0,
            uomName: UoMName.grams,
            uomType: UoMType.mass,
        },
        quantityPer: GetBaseUoM(UoMType.mass),
    });
    const nutrientsAtCheapestCost: Record<string, NutrientFact> = {
        Carbohydrates: getInitializeNutrientFact("Carbohydrates"),
        Fat: getInitializeNutrientFact("Fat"),
        Protein: getInitializeNutrientFact("Protein"),
        Sodium: getInitializeNutrientFact("Sodium"),
    };

    for (const lineItem of recipe.lineItems) {
        let cheapestProduct = null;
        let cheapestCostPerBase = Infinity;

        // Loop through each product and supplier to find the one with the lowest cost
        for (const product of GetProductsForIngredient(lineItem.ingredient)) {
            for (const supplier of product.supplierProducts) {
                const costPerBase = GetCostPerBaseUnit(supplier);
                if (costPerBase < cheapestCostPerBase) {
                    cheapestCostPerBase = costPerBase;
                    cheapestProduct = product;
                }
            }
        }
        if (!cheapestProduct) {
            console.warn(`No valid product found for ${lineItem.ingredient.ingredientName}`);
            continue;
        }

        const cheapestSupplier = cheapestProduct.supplierProducts.reduce((prev, curr) => (GetCostPerBaseUnit(prev) < GetCostPerBaseUnit(curr) ? prev : curr));

        // Convert lineItem.unitOfMeasure to base unit because that's what the cost is based on
        const baseUOM = GetBaseUoM(lineItem.unitOfMeasure.uomType);
        const neededSupplierUnits = ConvertUnits(lineItem.unitOfMeasure, baseUOM.uomName, baseUOM.uomType);
        const costperunit = GetCostPerBaseUnit(cheapestSupplier);
        const cost = costperunit * neededSupplierUnits.uomAmount;

        cheapestCost += cost;

        // Get the nutrient facts for the cheapest product
        for (const nf of cheapestProduct.nutrientFacts) {
            const { nutrientName, quantityAmount } = GetNutrientFactInBaseUnits(nf);
            nutrientsAtCheapestCost[nutrientName].quantityAmount = SumUnitsOfMeasure(nutrientsAtCheapestCost[nutrientName].quantityAmount, quantityAmount);
        }
    }

    recipeSummary[recipe.recipeName] = {
        cheapestCost,
        nutrientsAtCheapestCost,
    };
}

/*
 * YOUR CODE ABOVE THIS, DO NOT MODIFY BELOW
 * */
RunTest(recipeSummary);
