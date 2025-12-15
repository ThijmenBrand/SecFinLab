# {Sec}urity{Fin}ding{Lab}eler

⚠️Important notice! AI is heavily used during the development of this project. Code is slopy, in bad quality and insecure, but it works for its prupose.

## Introduction

This project is in inspiration on the [SeFiLa](https://github.com/abdullahgulraiz/SeFiLa) repository. This project is able to identify duplicate findings in two AST report files. You can go through both files, finding by finding, or CVE by CVE and label them as duplicate. Then you can go and make an ASPM export and import it, along with the just created duplicate ground truth and it will calculate a recall, precision and F1 score.

## How to run?

1. Run `$> npm install`
2. Run `$> npm run dev`
3. Import two SARIF files
4. Start labeling
5. Export the ground truth
6. Navigate to "Deduplication evaluator"
7. Import the ground truth and ASPM export
8. See the Precision, recall and F1 score populate.
