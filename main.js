"use strict";

var canvas, gl, program, attribs = {}, buffers = {}, example = 2, pik = Math.PI/180;
var params = {
  _translationX: 0,
  _translationY: 0,
  _angle: 0,
  _scaleX: 1, 
  _scaleY: 1,
  get translation() {
    return [this._translationX, this._translationY];
  },
  get angle() {
    return this._angle;
  },
  get scale() {
    return [this._scaleX, this._scaleY];
  },
  set angle(val) {
    this._angle = val * pik;
  }
};

function buildUserInterface() {
  // make canvas
  canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 500;
  canvas.style.border = "10px solid black";
  document.body.appendChild(canvas);

  // make controls
  var appendControl = (caption, control) => {
    var root = document.createElement('div');
    var name = document.createElement('label');
    var id = 'control-' + new Date().getTime();
    name.innerText = caption;
    name.setAttribute('for', id);
    control.setAttribute('id', id);
    root.appendChild(name);
    root.appendChild(control);
    document.body.appendChild(root);
  };
  // 1 - translation x control
  var control = document.createElement('input');
  control.type = 'range';
  control.min = 0;
  control.max = canvas.width;
  control.value = params._translationX;
  control.oninput = e => {
    params._translationX = e.target.value;
    drawScene();
  };
  appendControl('translate X', control);
  // 2 - translation y control
  var control = document.createElement('input');
  control.type = 'range';
  control.min = 0;
  control.max = canvas.height;
  control.value = -params._translationY;
  control.oninput = e => {
    params._translationY = e.target.value;
    drawScene();
  };
  appendControl('translate Y', control);
  // 3 - rotate control
  var control = document.createElement('input');
  control.type = 'range';
  control.min = -360;
  control.max = 360;
  control.value = params.angle/pik;
  control.oninput = e => {
    params.angle = e.target.value;
    drawScene();
  };
  appendControl('rotate', control);
  // 4 - scale x control
  var control = document.createElement('input');
  control.type = 'range';
  control.min = -5;
  control.max = 5;
  control.step = 0.1;
  control.value = params._scaleX;
  control.oninput = e => {
    params._scaleX = e.target.value;
    drawScene();
  };
  appendControl('scale x', control);
  // 5 - scale y control
  var control = document.createElement('input');
  control.type = 'range';
  control.min = -5;
  control.max = 5;
  control.step = 0.1;
  control.value = params._scaleY;
  control.oninput = e => {
    params._scaleY = e.target.value;
    drawScene();
  };
  appendControl('scale y', control);
}

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function randomInt(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand;
}

function setRect(gl, x, y, w, h) {
    var x1 = x;
    var x2 = x + w;
    var y1 = y;
    var y2 = y + h;

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2
        ]),
        gl.STATIC_DRAW
    );
}

function setCirc(gl, sx, sy, r, n) {
    var positions = [];
    var pi2 = 2*Math.PI;
    var pi2n = pi2/n;
    var x1 = sx; //Math.sin(0) = 0
    var y1 = r + sy; // Math.cos(0) = 1
    positions.push(x1, y1, x1, sy); // y1 - r = sy
    for(var k = pi2n; k < pi2; k += pi2n) {
        var x = r * Math.sin(k) + sx;
        var y = r * Math.cos(k) + sy;
        positions.push(x, y);
        positions.push(x, y, x1, sy);
    }
    positions.push(x1, y1);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW
    );
}

function drawScene() {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 1, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  
  gl.enableVertexAttribArray(attribs.position);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(attribs.position, size, type, normalize, stride, offset);

  gl.enableVertexAttribArray(attribs.color);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(attribs.color, 4, gl.FLOAT, false, 0, 0);
  
  var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
  matrix = m3.translate(matrix, params.translation[0], params.translation[1]);
  matrix = m3.rotate(matrix, params.angle);
  matrix = m3.scale(matrix, params.scale[0], params.scale[1]);
  gl.uniformMatrix3fv(attribs.matrixLocation, false, matrix);

  gl.drawArrays(gl.TRIANGLES, 0, 75);
  
}

function main() {
  buildUserInterface();

  gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  var vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec4 a_color;

    uniform mat3 u_matrix;

    varying vec4 v_color;
    
    void main() {
        gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

        v_color = a_color;
    }
  `;
  var fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 v_color;

    void main() {
        gl_FragColor = v_color;
    }
  `;

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  program = createProgram(gl, vertexShader, fragmentShader);

  attribs.position = gl.getAttribLocation(program, "a_position");
  attribs.color = gl.getAttribLocation(program, 'a_color');
  attribs.matrixLocation = gl.getUniformLocation(program, "u_matrix");

  buffers.position = gl.createBuffer();
  buffers.color = gl.createBuffer();

  examples[example]();

//   webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  drawScene();
}

var examples = [
  /**
   * 0 example
   * create scene with random rects
   */
  function(gl, canvas, colorUniformLocation) {
    for(var i = 0; i < 10; ++i) {
      var x = randomInt(0, canvas.width);
      var y = randomInt(0, canvas.height);
      var w = randomInt(0, canvas.width - x);
      var h = randomInt(0, canvas.height - y);
      setRect(gl, x, y, w, h);
      // gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  },
  /**
   * 1 example
   * create scene with random circles
   */
  function(gl, canvas, colorUniformLocation) {
    for(var i = 0; i < 10; i++) {
      var r = randomInt(1, Math.min(canvas.width, canvas.height)/2);
      var x = randomInt(r, canvas.width - r);
      var y = randomInt(r, canvas.height - r);
      var k = 25;
      setCirc(gl, x, y, r, k);
      // gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
      gl.drawArrays(gl.TRIANGLES, 0, k*3);
    }
  },
  /**
   * 2 example
   */
  function() {
    // use positions
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    // setRect(gl, -50, -50, 100, 100);
    setCirc(gl, 0, 0, 50, 25);

    // use colors
    var colors = [];
    // triangles count
    for(var i = 0; i < 75; i++) {
      var r = Math.random();
      var g = Math.random();
      var b = Math.random();
      colors.push(r, g, b, 1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(colors),
      gl.STATIC_DRAW
    );
  }
];

main();
