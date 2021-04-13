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
        aspects.push(grader_configuration[d].aspect);
    }
    aspects = aspects.filter(function (value, index, self) {
        return self.indexOf(value) === index
    });

    // Create headers
    let grid_string = "<div class=\"row\"><div class=\"col\"> </div>";
    for (let student of active_group){
        grid_string += "<div class=\"col\">"+ student[0] +"</div>"
    }
    grid_string += "</div>";

    // Create input rows
    if (dimensions.length === 0){
        dimensions.push("[unnamed]")
    }
    let color_counter = 0;
    for (let asp of aspects){
        if (asp !== undefined) {
            grid_string += "<div class=\"row mb-2 align-items-center\" style='background-color: " + color_palette[color_counter] + "'><div class='col text-center'><b>" + asp + "</b></div></div>";
        }
        for (let dim of dimensions){
            if (dim !== "exam_settings" && (asp === "[unnamed]" || grader_configuration[dim].aspect === asp)){
                grid_string += "<div class=\"row mb-2 align-items-center \" style='background-color: "+ color_palette[color_counter] +"'>";
                grid_string += "<div class=\"col align-self-center\">"+ dim.replaceAll("_", " ") + " ("+ grader_configuration[dim].min + "-"+ grader_configuration[dim].max +")</div>";
                for (let student of active_group){
                    grid_string += "<div class=\"col align-self-center\"><input type='number' min='"+ grader_configuration[dim].min +"' max='"+ grader_configuration[dim].max +"' style=\"width: 50px;\"></div>"
                }
                grid_string += "</div>";
            }
        }
        grid_string += "<div class=\"row\"></div>";
        color_counter++;
    }
    grid_string += "</div>";
    $("#grading_box").html(grid_string);
}