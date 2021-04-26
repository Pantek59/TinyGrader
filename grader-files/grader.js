const color_palette = ["#0087ff", "#00d75f", "#8787ff", "#afaf00", "#d7ff00", "#ff5faf"];
let grader_configuration;
let grader_class;
let grader_groups = [];

function read_config(){
    let file = document.getElementById("config_file").files[0];
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        document.getElementById("config_area").value = reader.result;
        grader_configuration = TOML.parse(document.getElementById("config_area").value);
    });
    reader.readAsText(file);
}

function read_class(){
    let file = document.getElementById("class_file").files[0];
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        let class_raw = reader.result;
        document.getElementById("class_area").value = class_raw;
        grader_class = CSVToArray(class_raw,";");
        for (let student of grader_class){
            grader_groups.push(student[1]);
        }
        grader_groups = grader_groups.filter(function (value, index, self) {
            return self.indexOf(value) === index
        });
        let group_string = "";
        $("#group_selector").empty();
        for (let g of grader_groups){
            $("#group_selector").append("<option>"+ g +"</option>")
        }
    });
    reader.readAsText(file);
}

function init_grading(){
    console.log(grader_configuration);

    let active_group = [];
    for (let s of grader_class){
        if (s[1] === $("#group_selector option:selected").text()){
            active_group.push(s);
        }
    }
    $("#startup_box").hide();
    let dimensions = Object.keys(grader_configuration);
    let aspects = [];
    for (let d of dimensions){
        if (grader_configuration[d].aspect) {
            aspects.push(grader_configuration[d].aspect);
        }
    }
    aspects = aspects.filter(function (value, index, self) {
        return self.indexOf(value) === index
    });

    // Create headers
    let grid_string = "<div class=\"row\"><div class=\"col\"> </div>";
    for (let student of active_group){
        grid_string += "<div class=\"col text-center\">"+ student[0] +"</div>"
    }
    grid_string += "</div>";

    // Create input rows
    if (dimensions.length === 0){
        dimensions.push("[unnamed]")
    }
    let color_counter = 0;
    for (let asp of aspects){
        if (asp !== undefined) {
            grid_string += "<div class=\"row mt-3 mb-2 align-items-center\" style='background-color: " + color_palette[color_counter] + "'><div class='col text-center'><b>" + asp.replace(/_/g," ") + "</b></div></div>";
        }
        for (let dim of dimensions){
            if (dim !== "exam_settings" && (asp === "[unnamed]" || grader_configuration[dim].aspect === asp)){
                grid_string += "<div class=\"row mb-2 align-items-center \" style='background-color: "+ color_palette[color_counter] +"'>";
                grid_string += "<div class=\"col align-self-center input-group-text\">"+ dim.replace(/_/g," ") + " ("+ grader_configuration[dim].min + "-"+ grader_configuration[dim].max +")</div>";
                for (let student of active_group){
                    grid_string += "<div class=\"col align-self-center text-center\"><input step='0.5' onclick='update_grading(this)' onkeyup='update_grading(this)' onchange='update_grading(this)' type='number' data-student='"+ student[0] +"' data-dimension='"+ dim +"' data-aspect='"+ asp +"' min='"+ grader_configuration[dim].min +"' max='"+ grader_configuration[dim].max +"' style=\"width: 50px;\"></div>"
                }
                grid_string += "</div>";
            }
        }

        // Aspect Grade
        grid_string += "<div class=\"row mb-2 align-items-center \" style='background-color: "+ color_palette[color_counter] +"'>";
        grid_string += "<div class=\"col align-self-center input-group-text\"><b>"+ asp.replace(/_/g," ") + " Grade ("+ grader_configuration.exam_settings.scale_min + "-"+ grader_configuration.exam_settings.scale_max +")</b></div>";
        for (let student of active_group){
            grid_string += "<div class=\"col align-self-center text-center\"><input step='0.01' type='number' min='"+ grader_configuration.exam_settings.scale_min +"' data-student='"+ student[0] +"' data-dimension='grade' data-aspect='"+ asp +"' style=\"width: 50px;\" disabled></div>"
        }
        grid_string += "</div>";

        // Spacing Row
        grid_string += "<div class=\"row\"></div>";
        color_counter++;
    }
    grid_string += "<div class=\"row\"><div class='col'><b><u>Total Grade</b></u></div>";
    for (let student of active_group){
        grid_string += "<div class='col align-self-center text-center'><input step='0.01' type='number' min='"+ grader_configuration.exam_settings.scale_min +"' data-student='"+ student[0] +"' data-dimension='total_grade' style=\"width: 50px;\" disabled></div>";
    }
    grid_string += "</div></div>";
    $("#grading_box").html(grid_string);
}

function update_grading(element) {
    let affected_student = element.dataset.student;
    let affected_aspect = element.dataset.aspect;
    let max_weight = 0;
    let total_weight = 0;
    let all_grades = true;

    $('[data-student="' + affected_student + '"][data-aspect="' + affected_aspect + '"]').each(function () {
        if ($(this).val() !== "" && grader_configuration[$(this).data("dimension")]) {
            max_weight += grader_configuration[$(this).data("dimension")].weight * (grader_configuration[$(this).data("dimension")].max - grader_configuration[$(this).data("dimension")].min);
            total_weight += ($(this).val() - grader_configuration.exam_settings.scale_min) * grader_configuration[$(this).data("dimension")].weight;
        } else if ($(this).data("dimension") !== "grade"){
            all_grades = false;
            return false;
        }
    });
    if (all_grades){
        let aspect_grade = Math.round((1 + (((grader_configuration.exam_settings.scale_max)-1) * (total_weight / max_weight))) * 100) / 100;
        $("[data-dimension='grade'][data-student='" + affected_student +"'][data-aspect='" + affected_aspect +"']").val(aspect_grade);
    }
    else{
        $("[data-dimension='grade'][data-student=\"'+ affected_student +'\"][data-aspect=\"'+ affected_aspect +'\"]").empty();
    }

    // Calc total grade
    let counter = 0;
    let grade_sum= 0;
    $("[data-dimension='grade'][data-student='" + affected_student +"']").each(function () {
        counter++;
        grade_sum += $(this).val();
    });

    $("[data-dimension='total_grade'][data-student=\"'+ affected_student +'\"]").val(grade_sum/counter);
}