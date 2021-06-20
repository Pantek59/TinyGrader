const color_palette = ["#0087ff", "#00d75f", "#8787ff", "#afaf00", "#d7ff00", "#ff5faf"];
let grader_configuration;
let grader_class;
let grader_groups = [];
let saveLabel = "";
let schemeLabel;

function sortSelect(elementID) {
    let selElem = document.getElementById(elementID);
    var tmpAry = new Array();
    for (var i=0;i<selElem.options.length;i++) {
        tmpAry[i] = new Array();
        tmpAry[i][0] = selElem.options[i].text;
        tmpAry[i][1] = selElem.options[i].value;
    }
    tmpAry.sort();
    while (selElem.options.length > 0) {
        selElem.options[0] = null;
    }
    for (var i=0;i<tmpAry.length;i++) {
        var op = new Option(tmpAry[i][0], tmpAry[i][1]);
        selElem.options[i] = op;
    }
    return;
}

function read_config(){
    let file = document.getElementById("config_file").files[0];
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        document.getElementById("config_area").value = reader.result;
        grader_configuration = TOML.parse(document.getElementById("config_area").value);
    });
    reader.readAsText(file);
    saveLabel += file.name.substring(0,file.name.length-4);
    schemeLabel = file.name;
}

function read_class(){
    let file = document.getElementById("class_file").files[0];
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        let class_raw = reader.result;
        document.getElementById("class_area").value = class_raw;
        grader_class = CSVToArray(class_raw,";");
        for (let student of grader_class){
            if (student.length == 2)
                grader_groups.push(student[1]);
        }
        grader_groups = grader_groups.filter(function (value, index, self) {
            return self.indexOf(value) === index
        });
        $("#group_selector").empty();
        for (let g of grader_groups){
            $("#group_selector").append("<option>"+ g +"</option>")
        }
        sortSelect("group_selector");
    });
    reader.readAsText(file);
}

function init_grading() {
    let active_group = [];
    for (let s of grader_class) {
        if (s[1] === $("#group_selector option:selected").text()) {
            active_group.push(s);
        }
    }
    saveLabel += " " + active_group[0][1] + ".mrk";
    $("#startup_box").hide();
    let dimensions = Object.keys(grader_configuration);
    let aspects = [];
    for (let d of dimensions) {
        if (grader_configuration[d]["aspect"]) {
            aspects.push(grader_configuration[d]["aspect"]);
        }
    }
    aspects = aspects.filter(function (value, index, self) {
        return self.indexOf(value) === index
    });

    // Create headers
    let grid_string = "<div class=\"row\"><div class=\"col\"> </div>";
    for (let student of active_group) {
        grid_string += "<div class=\"col text-center\" data-name='student'>" + student[0] + "</div>"
    }
    grid_string += "</div>";

    // Create input rows
    if (dimensions.length === 0) {
        dimensions.push("[unnamed]")
    }
    let color_counter = 0;
    for (let asp of aspects) {
        let aspect_weight = 0;
        if (asp !== undefined) {
            grid_string += "<div class=\"row mt-3 mb-2 align-items-center\" style='background-color: " + color_palette[color_counter] + "'><div class='col text-center'><b>" + asp.replace(/_/g, " ") + "</b></div></div>";
        }
        for (let dim of dimensions) {
            if (dim !== "exam_settings" && (asp === "[unnamed]" || grader_configuration[dim]["aspect"] === asp)) {
                grid_string += "<div class=\"row mb-2 align-items-center \" style='background-color: " + color_palette[color_counter] + "'>";
                grid_string += "<div class=\"col align-self-center input-group-text\">" + dim.replace(/_/g, " ") + " (" + grader_configuration[dim].min + "-" + grader_configuration[dim].max + ")</div>";
                for (let student of active_group) {

                    if (grader_configuration[dim]["group_mark"]) {
                        grid_string += "<div class=\"col align-self-center text-center\"><input step='0.5' onclick='update_grading(this)' onkeyup='update_grading(this)' onchange='update_grading(this)' type='number' data-type='data_entry' data-student='" + student[0] + "' data-dimension='" + dim + "' data-aspect='" + asp + "' min='" + grader_configuration[dim].min + "' max='" + grader_configuration[dim].max + "' style=\"width: 75px;\"><br>";
                        grid_string += " Group: <span data-student='" + student[0] + "' data-type='group_mark' data-dimension='" + dim + "' data-aspect='" + asp + "'></span>";
                    } else {
                        grid_string += "<div class=\"col align-self-center text-center\"><input step='0.5' onclick='update_grading(this)' onkeyup='update_grading(this)' onchange='update_grading(this)' type='number' data-type='individual_mark' data-student='" + student[0] + "' data-dimension='" + dim + "' data-aspect='" + asp + "' min='" + grader_configuration[dim].min + "' max='" + grader_configuration[dim].max + "' style=\"width: 75px;\">";
                    }
                    grid_string += "</div>";
                }
                grid_string += "</div>";

                aspect_weight += grader_configuration[dim]["weight"];
            }
        }

        // Aspect Grade
        grid_string += "<div class=\"row mb-2 align-items-center \" style='background-color: " + color_palette[color_counter] + "'>";
        grid_string += "<div class=\"col align-self-center input-group-text\"><b>" + asp.replace(/_/g, " ") + " Grade (" + grader_configuration["exam_settings"]["scale_min"] + "-" + grader_configuration["exam_settings"]["scale_max"] + ")</b></div>";
        for (let student of active_group) {
            grid_string += "<div class=\"col align-self-center text-center\"><input step='0.01' type='number' min='" + grader_configuration["exam_settings"]["scale_min"] + "' data-student='" + student[0] + "' data-dimension='grade' data-weight='" + aspect_weight + "' data-aspect='" + asp + "' style=\"width: 70px;\" disabled></div>"
        }
        grid_string += "</div>";

        // Spacing Row
        grid_string += "<div class=\"row\"></div>";
        color_counter++;
    }
    grid_string += "<div class=\"row\"><div class='col'><b><u>Total Grade</b></u></div>";
    for (let student of active_group) {
        grid_string += "<div class='col align-self-center text-center'><input step='0.01' type='number' min='" + grader_configuration["exam_settings"]["scale_min"] + "' data-student='" + student[0] + "' data-dimension='total_grade' style=\"width: 70px;\" disabled></div>";
    }
    grid_string += "</div></div>";
    $("#grading_box").html(grid_string);
    $("#save_button").show();
}

function update_grading(element) {
    let affected_student = element.dataset.student;
    let affected_aspect = element.dataset.aspect;
    let affected_dimension = element.dataset.dimension;
    let max_weight = 0;
    let total_weight = 0;
    let all_aspect_grades = true;

    // TODO Check whether entry within scale
    if (element.value != "") {
        if (element.value < Number(grader_configuration[affected_dimension]["min"])) {
            element.value = Number(grader_configuration[affected_dimension]["min"]);
        }
        if (element.value > Number(grader_configuration[affected_dimension]["max"])) {
            element.value = Number(grader_configuration[affected_dimension]["max"]);
        }
    }

    // Group Mark?
    if (grader_configuration[affected_dimension]["group_mark"]){
        // Calc group mark if possible
        let total = 0;
        let c = 0;
        let elements = $(":input[data-dimension='" + affected_dimension + "'][data-aspect='" + affected_aspect + "']");
        elements.each(function (){
            let v = Number($(this).val());
            if (v === 0){
                total = 0;
                return false;
            }
            else {
                total += v;
                c++;
            }
        });
        if (c < elements.length){
            // Clear group mark spans
            $("[data-type='group_mark'][data-dimension='" + affected_dimension + "']").empty();
        }
        else{
            // Fill group mark spans
            $("[data-type='group_mark'][data-dimension='" + affected_dimension + "']").text(Math.round(total/c*100)/100);
        }
    }

    // Recalc ALL aspect grades
    $("[data-dimension='grade']").each(function () {
        calcAspectGrade($(this).get(0));
    });

    calcTotalGrades();
}

function calcAspectGrade(element){
    let affected_student = $(element).data("student");
    let affected_aspect = $(element).data("aspect");
    let max_weight = 0;
    let total_weight = 0;
    let all_aspect_grades = true;

    // Add up dimension individual marks
    $('[data-type="individual_mark"][data-student="' + affected_student + '"][data-aspect="' + affected_aspect + '"]').each(function () {
        if ($(this).val() !== "" && grader_configuration[$(this).data("dimension")]) {
            max_weight += grader_configuration[$(this).data("dimension")].weight * (grader_configuration[$(this).data("dimension")].max - grader_configuration[$(this).data("dimension")].min);
            total_weight += ($(this).val() - grader_configuration["exam_settings"]["scale_min"]) * grader_configuration[$(this).data("dimension")].weight;
        }
        else if ($(this).data("dimension") !== "grade"){
            all_aspect_grades = false;
            return false;
        }
    });

    if (all_aspect_grades) {
        // Add up dimension group marks
        let groupMarkList = $('[data-type="group_mark"][data-student="' + affected_student + '"][data-aspect="' + affected_aspect + '"]');
        groupMarkList.each(function () {
            let groupMark = Number($(this).text());
            if (groupMark > 0) {
                // group mark exists
                max_weight += grader_configuration[$(this).data("dimension")].weight * (grader_configuration[$(this).data("dimension")].max - grader_configuration[$(this).data("dimension")].min);
                total_weight += (groupMark - grader_configuration["exam_settings"]["scale_min"]) * grader_configuration[$(this).data("dimension")].weight;
            } else if ($(this).data("dimension") !== "grade") {
                all_aspect_grades = false;
                return false;
            }
        });
    }

    // Recalc aspect grade
    if (all_aspect_grades){ // can aspect mark be calculated?
        let aspect_grade = Math.round((1 + (((grader_configuration["exam_settings"]["scale_max"])-1) * (total_weight / max_weight))) * 100) / 100;
        $("[data-dimension='grade'][data-student='" + affected_student +"'][data-aspect='" + affected_aspect +"']").val(aspect_grade);
    }
    else{
        $("[data-dimension='grade'][data-student=\"'+ affected_student +'\"][data-aspect=\"'+ affected_aspect +'\"]").empty();
    }
}

function calcTotalGrades() {
    $("[data-dimension='total_grade']").each(function () {
        let affected_student = $(this).data("student");

        // Recalc ALL total grades
        let counter = 0;
        let gradeSum = 0;
        let weigthSum = 0;
        let weigthMax = 0;
        let grade_fields = $(":input[data-dimension='grade'][data-student='" + affected_student + "']");
        grade_fields.each(function () {
            if ($(this).val() > 0 || isNaN($(this).val())){
                let weigth = Number($(this).data("weight"));
                counter++;
                gradeSum += Number($(this).val());
                weigthMax += weigth * (grader_configuration["exam_settings"]["scale_max"] - grader_configuration["exam_settings"]["scale_min"]);
                weigthSum += weigth * ($(this).val() - grader_configuration["exam_settings"]["scale_min"]);
            }
        });

        if (counter < grade_fields.length){
            $("[data-dimension='total_grade'][data-student=\"'+ affected_student +'\"]").empty();
        }
        else{
            // Calculate total grade
            let totalGrade;
            if (grader_configuration["exam_settings"]["aspect_weights"]){
                totalGrade = Math.round((1 + (((grader_configuration["exam_settings"]["scale_max"])-1) * (weigthSum / weigthMax))) * 100) / 100;
            }
            else {
                // Total Grade = Average of all aspects
                totalGrade = Math.round(gradeSum / counter * 100) / 100;
            }
            $("[data-dimension='total_grade'][data-student='" + affected_student + "']").val(totalGrade);
        }
    })
}

function saveClass() {
    let studentList=[];
    let aspectList=[];
    let dimensionList=[];

    $("[data-name='student']").each(function () {
        studentList.push($(this).text());
    });


    $("[data-student='" + studentList[0] + "'][data-dimension='grade']").each(function () {
        let aspect = $(this).data("aspect");
        if (aspectList.indexOf(aspect) < 0) {
            aspectList.push(aspect);
        }
    });

    for (let a of aspectList)
    $("[data-student='" + studentList[0] + "'][data-aspect='" + a + "'][data-dimension!='grade'][data-type!='group_mark']").each(function (){
        dimensionList.push($(this).data("dimension"))
    })

    let saveString="[config]\nscheme = " + schemeLabel + "\n";
    for (let student of studentList){
        saveString += "\n[" + student + "]\n";
        for (let aspect of aspectList){
            saveString += "[" + student + "." + aspect + "]\n";
            for (let dimension of dimensionList){
                if ($("[data-aspect='" + aspect + "'][data-dimension='" + dimension + "']").length > 0)
                    saveString += dimension + " = " + $("[data-aspect='" + aspect + "'][data-dimension='" + dimension + "'][data-student='" + student + "']").val() + "\n";
            }
        }
    }
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(saveString));
    element.setAttribute('download', saveLabel);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}