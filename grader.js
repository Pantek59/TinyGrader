const color_palette = ["#0087ff", "#00d75f", "#8787ff", "#afaf00", "#d7ff00", "#ff5faf"];
let grader_configuration;
let grader_class;

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
    });
    reader.readAsText(file);
}

function init_grading(){
    console.log(grader_configuration);
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
    for (let student of grader_class){
        grid_string += "<div class=\"col\">"+ student[0] +"</div>"
    }
    grid_string += "</div>";

    // Create input rows
    if (dimensions.length === 0){
        dimensions.push("[unnamed]")
    }
    let color_counter = 0;
    for (let asp of aspects){
        for (let dim of dimensions){
            if (asp === "[unnamed]" || grader_configuration[dim].aspect === asp){
                grid_string += "<div class=\"row mb-2 align-items-center \" style='background-color: "+ color_palette[color_counter] +"'>";
                grid_string += "<div class=\"col align-self-center\">"+ dim.replaceAll("_", " ") + "</div>";
                for (let student of grader_class){
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