let body = d3.select("body")


body.append("h1")
    .text("Karakteristika žarnice in  upora")

//define svg container
let h = 500;
let w = 1000;
let padding = 30

let svg = body.append("svg")
    .attr("height", h)
    .attr("width", w)
    .attr("id", "svg-container")

//define tooltip
let tooltip = body.append("div")
    .attr("id", "tooltip")
    .attr("style","opacity: 0;")

fetch("/data.csv")
    .then(a=>a.text())
    .then(data=>{
        data = data.split("\r\n").map(a=>a.split(","))
        data = {
            "napetost": data[0].slice(1,data[0].length).map(a=>parseFloat(a)),
            "tok-žarnica": data[1].slice(1,data[1].length).map(a=>parseFloat(a)),
            "tok-82ohm-upornik": data[2].slice(1, data[2].length).map(a=>parseFloat(a))
        }
        let upornost = data["tok-žarnica"].map((a,i,b)=>(a-b[i-1])/(data["napetost"][i]-data["napetost"][i-1])).filter(a=>a)
        //define scales
        let xScale = d3.scaleLinear()
            .domain([0, d3.max(data["napetost"])])
            .range([padding, w-padding])
        let yScale = d3.scaleLinear()
            .domain([d3.max(data["tok-žarnica"].concat(data["tok-82ohm-upornik"])), 0])
            .range([padding, h-padding])
        
        //make path data
        let line1 = d3.line()
            .x(d=> xScale(data["napetost"][data["tok-žarnica"].indexOf(d)]))
            .y(d=>yScale(d))
        let line2 = d3.line()
            .x(d=>xScale(data["napetost"][data["tok-82ohm-upornik"].indexOf(d)]))
            .y(d=>yScale(d))
        
        //append path to svg
        svg.append("path")
            .attr("d", line1(data["tok-žarnica"]))
            .attr("id", "zarnica")

        svg.append("path")
            .attr("d", line2(data["tok-82ohm-upornik"]))
            .attr("id", "upornik")
        
        //add circles to values
        svg.selectAll("circle")
            .data(data["tok-žarnica"].concat(data["tok-82ohm-upornik"]))
            .enter()
            .append("circle")
            .attr("cy", d=>yScale(d))
            .attr("cx", (d,i)=>xScale(data["napetost"][i>13 ? i-14 : i]))
            .attr("r", 10)
            .attr("class","dot")
            .style("opacity", 1)
            .on("mouseover", (u,index,a)=>{
                let i1 = data["tok-žarnica"].concat(data["tok-82ohm-upornik"])[index];
                let i2 = data["tok-žarnica"].concat(data["tok-82ohm-upornik"])[index-1];
                let u1 = data["napetost"][index>13 ? index-14 : index];
                let u2 = data["napetost"][(index>13 ? index-14 : index)-1];
                let r = Math.floor((i1-i2)/(u1-u2)*1000)/1000
                tooltip.attr("style", `opacity: 1; left: ${d3.event.pageX+10}px; top: ${d3.event.pageY-30}px`)
                    .text(`Napetost: ${u1}\nTok: ${i1} mA\nUpornost: ${r}`)
            
            })
            .on("mouseout", (c, a, b) => {
                tooltip.attr("style", `opacity: 0`)
                    .text("")
            })
        //define axis
        let yAxis = d3.axisLeft(yScale)
        let xAxis = d3.axisBottom(xScale)

        //append axis
        svg.append("g")
            .attr("transform", "translate(0," + (h-padding) + ")")
            .call(xAxis)

        svg.append("g")
            .attr("transform", "translate("+padding+", 0)")
            .call(yAxis)

        //graf uporosti
        let grafUpornost = body.append("svg")
            .attr("width", w)
            .attr("height", h)
        let yScaleUpornost = d3.scaleLinear()
            .domain([0, d3.max(upornost)])
            .range([h-padding,padding])
        let xScaleUpornost = d3.scaleLinear()
            .domain([0, 13])
            .range([padding, w-padding])
        let yAxisUpornost = d3.axisLeft(yScaleUpornost)
        let xAxisUpornost = d3.axisBottom(xScaleUpornost)
        grafUpornost.selectAll("rect")
            .data(upornost)
            .enter()
            .append("rect")
            .attr("x", (d,i)=>xScaleUpornost(i+1)-15)
            .attr("y", d=>yScaleUpornost(d))
            .attr("height", d=>yScaleUpornost(0)-yScaleUpornost(d))
            .attr("width", 30)
            .on("mouseover", (e)=>{
                tooltip.style("opacity", 1)
                    .text(`Upornost: ${Math.floor(e*100)/100}`)
                    .attr("style", `left: ${d3.event.pageX+10}px; top: ${d3.event.pageY-30}px`)
            })
            .on("mousemove", e=>{
                tooltip.attr("style", `left: ${d3.event.pageX+10}px; top: ${d3.event.pageY-30}px`)
            })
            .on("mouseout", e=>{
                tooltip.style("opacity", 0)
                    .text("")
            })
        grafUpornost.append("g")
            .attr("transform", "translate("+padding+", 0)") 
            .call(yAxisUpornost)
        grafUpornost.append("g")
            .attr("transform", "translate("+(0)+", " + (h-padding) + ")") 
            .call(xAxisUpornost)
    })

body.append("p")
    .html("Kot lahko vidimo, se <b class='green'>krivulja z žarnico</b> spreminja zelo neenakomerno, sploh v začetku - na koncu se počasi umirja. Iz tega lahko razberemo, da se upornost tu spreminaj, na drugem grafu pa je sprememba zanemarljiva. To spremembo upornosti (prvega grafa) lahko vidimo na naslednjem grafu. Za razliko od nje, pa je <b class='blue'>krivulja z upornikom</b>  relavitno enakomerna, upornost je večinoma enaka.\n\n <b>αT vpliva na obliko:</b> večja, kot je absolutna vrednost števila, večji je naklon (pozitivno ali negativno, če je število enako 0, spremembe ni in je zato graf enakomeren.\n\n<b>Pri NTK</b> se pri konstantni napetosti tok povečuje, saj se zaradi negativnega αT upornost zmanjšuje (zaradi segrevanja polprevodnika).")