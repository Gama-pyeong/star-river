/* ================= 加载 ================= */
function hideLoader(){
  var l = document.getElementById('loader');
  if(l) l.classList.add('off');
}
window.addEventListener('load', function(){ setTimeout(hideLoader, 620); });
setTimeout(hideLoader, 3000);
(function(){
  var msgs = ['INITIALIZING DATA GRAPH…','LOADING LAUNCH RECORDS…','RENDERING RAIL NETWORK…','CALIBRATING COORDINATES…'];
  var i = 0, el = document.getElementById('loadTxt');
  var t = setInterval(function(){
    i++; if(i >= msgs.length){clearInterval(t);return;}
    if(el) el.textContent = msgs[i];
  }, 340);
})();

/* ================= 星空 ================= */
(function(){
  var cv = document.getElementById('stars');
  if(!cv) return;
  var ctx = cv.getContext('2d');
  var W, H, stars = [], shooting = [];
  function resize(){
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
    var n = Math.min(260, Math.floor(W*H/8600));
    stars = [];
    for(var i=0;i<n;i++){
      stars.push({
        x: Math.random()*W, y: Math.random()*H,
        r: Math.random()*1.25 + .28,
        a: Math.random()*.62 + .16,
        s: Math.random()*.16 + .03,
        p: Math.random()*Math.PI*2
      });
    }
  }
  window.addEventListener('resize', resize);
  resize();
  function shoot(){
    if(Math.random() < .012 && shooting.length < 3){
      shooting.push({x:Math.random()*W*.75, y:Math.random()*H*.42, l:Math.random()*150+95, v:Math.random()*7+6, life:1});
    }
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<stars.length;i++){
      var s = stars[i];
      s.p += .012;
      var a = s.a + Math.sin(s.p)*.2;
      if(a < .04) a = .04;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(214,232,255,'+a.toFixed(3)+')';
      ctx.arc(s.x, s.y, s.r, 0, 6.2832);
      ctx.fill();
    }
    shoot();
    for(var j=shooting.length-1;j>=0;j--){
      var m = shooting[j];
      var g = ctx.createLinearGradient(m.x, m.y, m.x+m.l, m.y+m.l);
      g.addColorStop(0,'rgba(150,225,255,0)');
      g.addColorStop(.5,'rgba(190,240,255,.75)');
      g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x+m.l, m.y+m.l); ctx.stroke();
      m.x += m.v; m.y += m.v; m.life -= .012;
      if(m.life <= 0 || m.x > W || m.y > H) shooting.splice(j,1);
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ================= 滚动交互 ================= */
var nav = document.getElementById('nav');
var prog = document.getElementById('prog');
var topBtn = document.getElementById('top');
function onScroll(){
  var st = window.pageYOffset || document.documentElement.scrollTop;
  var h = document.documentElement.scrollHeight - window.innerHeight;
  prog.style.width = (h > 0 ? (st/h*100) : 0) + '%';
  nav.classList.toggle('solid', st > 60);
  topBtn.classList.toggle('show', st > 700);
  var links = document.querySelectorAll('.nav-a');
  var cur = '';
  for(var i=0;i<links.length;i++){
    var id = links[i].getAttribute('href').slice(1);
    var sec = document.getElementById(id);
    if(sec && sec.offsetTop - 140 <= st) cur = id;
  }
  for(var k=0;k<links.length;k++){
    links[k].classList.toggle('on', links[k].getAttribute('href') === '#'+cur);
  }
}
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();
topBtn.addEventListener('click', function(){ window.scrollTo({top:0,behavior:'smooth'}); });

document.querySelectorAll('[data-go]').forEach(function(b){
  b.addEventListener('click', function(){
    var t = document.querySelector(b.getAttribute('data-go'));
    if(t) t.scrollIntoView({behavior:'smooth'});
  });
});

/* ================= 数字滚动 ================= */
function animateCount(el){
  if(el.dataset.done) return;
  el.dataset.done = '1';
  var target = parseFloat(el.dataset.count);
  var dec = parseInt(el.dataset.dec || '0', 10);
  var t0 = null, dur = 1500;
  function step(ts){
    if(!t0) t0 = ts;
    var p = Math.min((ts-t0)/dur, 1);
    var e = 1 - Math.pow(1-p, 3);
    el.textContent = (target*e).toFixed(dec);
    if(p < 1) requestAnimationFrame(step);
    else el.textContent = target.toFixed(dec);
  }
  requestAnimationFrame(step);
}

/* ================= 入场 ================= */
function revealAll(){
  document.querySelectorAll('.rv').forEach(function(el){
    el.classList.add('in');
    el.querySelectorAll('[data-count]').forEach(animateCount);
  });
}
if('IntersectionObserver' in window){
  var ioAlive = false;
  var io = new IntersectionObserver(function(entries){
    ioAlive = true;
    entries.forEach(function(en){
      if(en.isIntersecting){
        en.target.classList.add('in');
        en.target.querySelectorAll('[data-count]').forEach(animateCount);
        io.unobserve(en.target);
      }
    });
  }, {threshold:.14, rootMargin:'0px 0px -60px 0px'});
  document.querySelectorAll('.rv').forEach(function(el, i){
    el.style.transitionDelay = Math.min(i%6*70, 350) + 'ms';
    io.observe(el);
  });
  setTimeout(function(){
    if(!ioAlive){
      revealAll();
      return;
    }
    document.querySelectorAll('.rv:not(.in)').forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.top < window.innerHeight && r.bottom > 0){
        el.classList.add('in');
        el.querySelectorAll('[data-count]').forEach(animateCount);
      }
    });
  }, 2500);
}else{
  revealAll();
}

/* ================= 时间轴组件 ================= */
function buildTimeline(trackId, panelId, data){
  var track = document.getElementById(trackId);
  var panel = document.getElementById(panelId);
  if(!track || !panel) return;
  data.forEach(function(d, i){
    var n = document.createElement('div');
    n.className = 'tl-node' + (i===0?' on':'');
    n.innerHTML = '<div class="y">'+d.date+'</div><div class="n">'+d.short+'</div><div class="d">'+d.tag+'</div>';
    n.addEventListener('click', function(){
      track.querySelectorAll('.tl-node').forEach(function(x){x.classList.remove('on');});
      n.classList.add('on');
      render(d);
    });
    track.appendChild(n);
  });
  function render(d){
    var met = (d.metrics||[]).map(function(m){
      return '<div><b>'+m[0]+'</b>'+m[1]+'</div>';
    }).join('');
    panel.innerHTML =
      '<div class="p-date">'+d.full+'</div>'+
      '<div class="p-title">'+d.title+'</div>'+
      '<div class="p-text">'+d.text+'</div>'+
      (met ? '<div class="p-metrics">'+met+'</div>' : '');
  }
  render(data[0]);
}

// 调用时间轴构建（使用 data.js 中的数据）
buildTimeline('tl-space','tlp-space', spaceTL);
buildTimeline('tl-rail','tlp-rail', railTL);

/* ================= 图表 ================= */
(function(){
  if(typeof echarts === 'undefined'){
    document.querySelectorAll('.chart').forEach(function(c){
      c.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#6e83a8;font-size:13px">图表库未能加载，请确认 echarts.min.js 与本文件位于同一目录</div>';
    });
    return;
  }

  var AXIS = '#6e83a8', SPLIT = 'rgba(120,160,230,.13)', TXT = '#a9bcdc';
  var baseGrid = {left:'3%', right:'4%', top:56, bottom:34, containLabel:true};
  var baseTip = {
    backgroundColor:'rgba(10,16,32,.94)',
    borderColor:'rgba(120,160,230,.32)',
    borderWidth:1,
    textStyle:{color:'#e9f0ff', fontSize:12.5},
    extraCssText:'backdrop-filter:blur(8px);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.5);padding:10px 14px;'
  };
  function grad(c1, c2){ return new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:c1},{offset:1,color:c2}]); }
  function gradX(c1, c2){ return new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:c1},{offset:1,color:c2}]); }
  var charts = [];
  function mk(id, opt){
    var dom = document.getElementById(id);
    if(!dom) return;
    var c = echarts.init(dom, null, {renderer:'canvas'});
    c.setOption(opt);
    charts.push(c);
    return c;
  }
  window.addEventListener('resize', function(){ charts.forEach(function(c){ c.resize(); }); });
    // 1. 航天发射
  mk('c-launch', {
    grid: baseGrid,
    tooltip: Object.assign({trigger:'axis', axisPointer:{type:'shadow', shadowStyle:{color:'rgba(120,160,230,.07)'}}}, baseTip),
    legend:{data:['成功发射','失利','成功率'], right:10, top:6, textStyle:{color:TXT,fontSize:12}, itemWidth:14, itemHeight:9, icon:'roundRect'},
    xAxis:{ type:'category', data:chartLaunchYears,
      axisLine:{lineStyle:{color:'rgba(120,160,230,.25)'}}, axisTick:{show:false}, axisLabel:{color:AXIS, fontSize:12} },
    yAxis:[
      {type:'value', name:'次数', nameTextStyle:{color:AXIS,fontSize:11,padding:[0,0,0,-18]},
       splitLine:{lineStyle:{color:SPLIT}}, axisLabel:{color:AXIS,fontSize:11}, axisLine:{show:false}, axisTick:{show:false}},
      {type:'value', name:'成功率 %', min:70, max:100, nameTextStyle:{color:AXIS,fontSize:11},
       splitLine:{show:false}, axisLabel:{color:AXIS,fontSize:11,formatter:'{value}%'}, axisLine:{show:false}, axisTick:{show:false}}
    ],
    series:[
      {name:'成功发射', type:'bar', stack:'a', barWidth:'46%', data:chartLaunchSucc, itemStyle:{color:grad('#5ee7ff','#2f6bff')}},
      {name:'失利', type:'bar', stack:'a', barWidth:'46%', data:chartLaunchTotal.map(function(v,i){return v-chartLaunchSucc[i];}), itemStyle:{color:grad('#ff8b7a','#e8404f'), borderRadius:[5,5,0,0]}},
      {name:'成功率', type:'line', yAxisIndex:1, smooth:true, symbol:'circle', symbolSize:7, data:chartLaunchRate,
       lineStyle:{width:2.4, color:'#ffc64d', shadowColor:'rgba(255,198,77,.5)', shadowBlur:12},
       itemStyle:{color:'#ffc64d', borderColor:'#0a1020', borderWidth:2},
       label:{show:true, position:'top', color:'#ffc64d', fontSize:10.5, formatter:'{c}%'}}
    ]
  });

  // 2. 高铁里程
  mk('c-rail', {
    grid: baseGrid, tooltip: Object.assign({trigger:'axis'}, baseTip),
    xAxis:{type:'category', boundaryGap:false, data:chartRailYears, axisLine:{lineStyle:{color:'rgba(120,160,230,.25)'}}, axisTick:{show:false}, axisLabel:{color:AXIS,fontSize:12}},
    yAxis:{type:'value', name:'万公里', nameTextStyle:{color:AXIS,fontSize:11}, splitLine:{lineStyle:{color:SPLIT}}, axisLabel:{color:AXIS,fontSize:11}, axisLine:{show:false}, axisTick:{show:false}},
    series:[{
      type:'line', smooth:true, data:chartRailKm, symbol:'circle', symbolSize:8,
      lineStyle:{width:3, color:gradX('#35e0f0','#4a86ff'), shadowColor:'rgba(53,224,240,.45)', shadowBlur:16},
      itemStyle:{color:'#35e0f0', borderColor:'#05080f', borderWidth:2},
      areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(53,224,240,.5)'},{offset:.55,color:'rgba(74,134,255,.16)'},{offset:1,color:'rgba(74,134,255,0)'}])},
      label:{show:true, position:'top', color:'#9fe9ff', fontSize:10.5, formatter:'{c}'}
    }]
  });

  // 3. 旅客发送量
  mk('c-pax', {
    grid: baseGrid, tooltip: Object.assign({trigger:'axis', axisPointer:{type:'shadow'}}, baseTip),
    xAxis:{type:'category', data:chartRailYears, axisLine:{lineStyle:{color:'rgba(120,160,230,.25)'}}, axisTick:{show:false}, axisLabel:{color:AXIS,fontSize:12}},
    yAxis:{type:'value', name:'亿人次', nameTextStyle:{color:AXIS,fontSize:11}, splitLine:{lineStyle:{color:SPLIT}}, axisLabel:{color:AXIS,fontSize:11}, axisLine:{show:false}, axisTick:{show:false}},
    series:[{
      type:'bar', data:chartPax, barWidth:'52%',
      itemStyle:{borderRadius:[5,5,0,0], color:function(p){ if(p.dataIndex === 5 || p.dataIndex === 7) return grad('#8fa3c8','#4b5f85'); return grad('#a98bff','#3f63d6'); }},
      label:{show:true, position:'top', color:'#c4b5ff', fontSize:10, formatter:function(p){ return p.dataIndex===5||p.dataIndex===7 ? p.value+'\n(疫后低谷)' : p.value; }},
      markLine:{silent:true, symbol:'none', data:[{type:'average', name:'均值'}], lineStyle:{color:'rgba(255,198,77,.6)', type:'dashed'}, label:{color:'#ffc64d', fontSize:11, formatter:'均值 {c}'}}
    }]
  });

  // 4. 5G 基站
  mk('c-5g', {
    grid: baseGrid, tooltip: Object.assign({trigger:'axis', axisPointer:{type:'shadow'}}, baseTip),
    xAxis:{type:'category', data:chart5GYears, axisLine:{lineStyle:{color:'rgba(120,160,230,.25)'}}, axisTick:{show:false}, axisLabel:{color:AXIS,fontSize:12}},
    yAxis:{type:'value', name:'万个', nameTextStyle:{color:AXIS,fontSize:11}, splitLine:{lineStyle:{color:SPLIT}}, axisLabel:{color:AXIS,fontSize:11}, axisLine:{show:false}, axisTick:{show:false}},
    series:[{
      type:'bar', data:chart5GData, barWidth:'50%',
      itemStyle:{borderRadius:[6,6,0,0], color:grad('#3fd6a0','#1c7f8f')},
      label:{show:true, position:'top', color:'#8fe8c6', fontSize:10.5},
      markLine:{silent:true, symbol:'none', data:[{yAxis:483.8, label:{formatter:'2025 年 483.8 万个', color:'#3fd6a0', fontSize:11, position:'insideEndTop'}}], lineStyle:{color:'rgba(63,214,160,.5)', type:'dashed'}}
    }]
  });

  // 5. 研发投入
  mk('c-rd', {
    grid: baseGrid, tooltip: Object.assign({trigger:'axis'}, baseTip),
    legend:{data:['研发经费投入','投入强度'], right:10, top:6, textStyle:{color:TXT,fontSize:12}, itemWidth:14, itemHeight:9, icon:'roundRect'},
    xAxis:{type:'category', data:chartRdYears, boundaryGap:true, axisLine:{lineStyle:{color:'rgba(120,160,230,.25)'}}, axisTick:{show:false}, axisLabel:{color:AXIS,fontSize:12}},
    yAxis:[
      {type:'value', name:'亿元', nameTextStyle:{color:AXIS,fontSize:11}, splitLine:{lineStyle:{color:SPLIT}}, axisLabel:{color:AXIS,fontSize:11,formatter:function(v){return v/10000+'万';}}, axisLine:{show:false}, axisTick:{show:false}},
      {type:'value', name:'强度 %', min:1.8, max:3, nameTextStyle:{color:AXIS,fontSize:11}, splitLine:{show:false}, axisLabel:{color:AXIS,fontSize:11,formatter:'{value}%'}, axisLine:{show:false}, axisTick:{show:false}}
    ],
    series:[
      {name:'研发经费投入', type:'bar', data:chartRdMoney, barWidth:'46%', itemStyle:{borderRadius:[6,6,0,0], color:grad('#5ee7ff','#2f4fbf')}},
      {name:'投入强度', type:'line', yAxisIndex:1, smooth:true, data:chartRdIntensity, symbol:'circle', symbolSize:7, lineStyle:{width:2.4, color:'#ffc64d', shadowColor:'rgba(255,198,77,.5)', shadowBlur:12}, itemStyle:{color:'#ffc64d', borderColor:'#0a1020', borderWidth:2}, areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(255,198,77,.22)'},{offset:1,color:'rgba(255,198,77,0)'}])}, label:{show:true, position:'bottom', color:'#ffc64d', fontSize:10.5, formatter:'{c}%'}}
    ]
  });

  // 6. 全球发射分布
  mk('c-global', {
    grid:{left:'3%', right:'9%', top:26, bottom:20, containLabel:true},
    tooltip: Object.assign({trigger:'item'}, baseTip),
    xAxis:{type:'value', name:'次', nameTextStyle:{color:AXIS,fontSize:11}, splitLine:{lineStyle:{color:SPLIT}}, axisLabel:{color:AXIS,fontSize:11}, axisLine:{show:false}, axisTick:{show:false}},
    yAxis:{type:'category', data:chartGlobalData.map(function(d){return d.name;}).reverse(), axisLine:{lineStyle:{color:'rgba(120,160,230,.25)'}}, axisTick:{show:false}, axisLabel:{color:TXT, fontSize:13, fontWeight:600}},
    series:[{
      type:'bar', barWidth:'52%',
      data:chartGlobalData.map(function(d,i){ return {value:d.value, itemStyle:{borderRadius:[0,6,6,0], color: d.name==='中国' ? gradX('#ff7a86','#ff3b4e') : gradX('#4a7bd8','#25407a')}}; }).reverse(),
      label:{show:true, position:'right', color:'#cfe0ff', fontSize:12, fontWeight:600}
    }]
  });

  setTimeout(function(){ charts.forEach(function(c){ c.resize(); }); }, 400);
  window.addEventListener('load', function(){ setTimeout(function(){ charts.forEach(function(c){ c.resize(); }); }, 300); });
})();