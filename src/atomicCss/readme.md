Nuova convenzione per dare i nomi alle classi css da usare sui nuovi stili.

# Nume della classe composto da più parole -> camelCase

## esempi:
    .trnCard
    .listContainer
    .ngLayout
    .ngFlex

### elementi html
    <div class="trnCard">
        ...
    </div>

# Per indicare che una classe definisce "figlio" di un elemento che lo racchiude, usare " - " 

## esempi:
    .trnCard-header
    .trnCard-content
    .trnCard-footer

### elementi html
    <div class="trnCard">
        <div class="trnCard-header"></div>
        <div class="trnCard-content"></div>
        <div class="trnCard-footer"></div>
    </div>

# Per classe atomiche o modificatori uasre " _ " 

## esempi:
    .trnCard_dark
    .text_small
    .bg_white
    .bg_dark
    .text_right


# Compilazione Scss
