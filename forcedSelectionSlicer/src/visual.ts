/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import FilterAction = powerbi.FilterAction;
import * as models from 'powerbi-models';

import { VisualFormattingSettingsModel } from "./settings";

export class Visual implements IVisual {
    private target: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private host: IVisualHost;
    private currentSelection: string;

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.host = options.host;
    }

    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);

        let category = options.dataViews[0].categorical.categories[0];
        let values = category.values;

        this.target.innerHTML = '';

        // Add each item into a drop-down list
        let select = document.createElement('select');
        values.forEach((item: string, index: number) => {
            let option = document.createElement('option');
            option.text = item.toString();
            select.add(option);
        })

        let find_value = values.findIndex((item: string) => item === this.currentSelection)
        select.selectedIndex = find_value >= 0 ? find_value : 0;
        this.filterByValue(category, select.options[select.selectedIndex].text)

        // Add for each item a click event
        select.addEventListener('change', (event) => {
            let selectedItem = select.options[select.selectedIndex].text;
            this.currentSelection = selectedItem;
            this.filterByValue(category, selectedItem); 
        });

        this.target.appendChild(select);
    }

    public filterByValue(category: powerbi.DataViewCategoryColumn, value: string) {
        this.host.applyJsonFilter({
            $schema: "http://powerbi.com/product/schema#basic",
            filterType: models.FilterType.Basic,
            target: {
                table: category.source.queryName.substring(0, category.source.queryName.indexOf('.')),
                column: category.source.displayName
            },
            operator: "In",
            values: [
                value
            ]
        }, "general", "filter", FilterAction.merge);
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}