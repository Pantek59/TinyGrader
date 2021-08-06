# Purpose
Tiny grader has been written to handle the grading process of small student groups with a mix of individual and group marks and different marking and grading grids. It returns the results in a consolidated CSV file, allowing easy further processing in the application of your choice.

# Usage
To start the grading process you need two things:

## 1. Marking Scheme
The marking scheme configures the dimensions and aspects of the grading process, contains the explanations, grade ranges, etc. It can be created any plain-text editor using [TOML notation](https://toml.io/en/). Use the example file to start off your own marking schemes.

## 2. Student List
Before starting the grading process you will have to select the grading mode (group or individual) and a fitting student list. TinyGrader expects the student list in CSV format follwing one of two patterns:  

### a) Group Format
`[student name] ; [group name]`  
This format can be use for group and individual marking. An example file for the group format has been added to TinyGrader.   
*For Moodle users:*  
In Moodle such a group export can be exported following these steps:
- [needs to be added]
- [needs to be added]
### b) Student Format
`[student name]`  
This format can be use for individual marking only.

# License
For the license agreement please refer to the text file named LICENSE.