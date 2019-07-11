// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as DesignerSurface from "./card-designer-surface";
import * as DesignerPeers from "./designer-peers";
import * as Adaptive from "adaptivecards";
import { DraggableElement } from "./draggable-element";
import { FieldDefinition } from "./data";

export abstract class BasePaletteItem extends DraggableElement {
    protected abstract getText(): string;
    protected abstract getIconClass(): string;

    protected internalRender(): HTMLElement {
        let element = document.createElement("div");
        element.className = "acd-palette-item";
        element.style.display = "flex";

        let iconElement = document.createElement("div");
        iconElement.classList.add("acd-icon", "acd-toolPalette-icon", this.getIconClass());
        iconElement.style.flex = "0 0 auto";

        let labelElement = document.createElement("div");
        labelElement.className = "acd-palette-item-label";
        labelElement.style.flex = "1 1 100%";
        labelElement.innerText = this.getText();

        element.appendChild(iconElement);
        element.appendChild(labelElement);

        return element;
    }

    renderDragVisual(): HTMLElement {
        return this.internalRender();
    }

    abstract createPeer(designer: DesignerSurface.CardDesignerSurface): DesignerPeers.CardElementPeer;
}

export class ElementPaletteItem extends BasePaletteItem {
    protected getText(): string {
        return this.typeRegistration.typeName;
    }

    protected getIconClass(): string {
        return this.peerRegistration.iconClass;
    }

    readonly typeRegistration: Adaptive.ITypeRegistration<Adaptive.CardElement>;
    readonly peerRegistration: DesignerPeers.DesignerPeerRegistrationBase;

    constructor(typeRegistration: Adaptive.ITypeRegistration<Adaptive.CardElement>, peerRegistration: DesignerPeers.DesignerPeerRegistrationBase) {
        super();

        this.typeRegistration = typeRegistration;
        this.peerRegistration = peerRegistration;
    }

    createPeer(designer: DesignerSurface.CardDesignerSurface): DesignerPeers.CardElementPeer {
        let peer = DesignerSurface.CardDesignerSurface.cardElementPeerRegistry.createPeerInstance(designer, null, this.typeRegistration.createInstance());
        peer.initializeCardElement();

        return peer;
    }
}

export class DataPaletteItem extends BasePaletteItem {
    protected getText(): string {
        return this.field.name;
    }

    protected getIconClass(): string {
        return null;
    }

    constructor(readonly field: FieldDefinition) {
        super();
    }

    createPeer(designer: DesignerSurface.CardDesignerSurface): DesignerPeers.CardElementPeer {
        let element: Adaptive.CardElement;

        if (this.field.isCollection) {
            element = new Adaptive.Container();
            element.setCustomProperty("$data", "{" + this.field.getPath() + "}");
        }
        else {
            let textBlock = new Adaptive.TextBlock();
            textBlock.text = "{" + this.field.getPath() + "}";

            element = textBlock;
        }

        let peer = DesignerSurface.CardDesignerSurface.cardElementPeerRegistry.createPeerInstance(designer, null, element);
        peer.initializeCardElement();

        return peer;
    }
}

export abstract class CustomPaletteItem extends BasePaletteItem {
    readonly category: string;

    protected getIconClass(): string {
        return "acd-icon-customPaletteItem";
    }

    constructor(category: string) {
        super();

        this.category = category;
    }
}

export class SnippetPaletteItem extends CustomPaletteItem {
    protected getText(): string {
        return this.name;
    }

    readonly name: string;
    snippet: object;

    constructor(category: string, name: string) {
        super(category);

        this.name = name;
    }

    createPeer(designer: DesignerSurface.CardDesignerSurface): DesignerPeers.CardElementPeer {
        if (this.snippet) {
            let rootElementTypeName = this.snippet["type"];

            if (rootElementTypeName) {
                let adaptiveElement = Adaptive.AdaptiveCard.elementTypeRegistry.createInstance(rootElementTypeName);

                if (adaptiveElement) {
                    adaptiveElement.parse(this.snippet);

                    let peer = DesignerSurface.CardDesignerSurface.cardElementPeerRegistry.createPeerInstance(designer, null, adaptiveElement);
                    peer.initializeCardElement();

                    return peer;
                }
            }
        }
    }
}
