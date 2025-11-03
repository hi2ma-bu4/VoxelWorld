import{C as U,V as g,E as O,M as L,O as N,B as F,F as b,S as _,U as W,a as k,W as X,H as j,N as q,b as V,c as H,d as Q,P as Y,e as K,A as Z,D as $,R as J,f as P,g as ee,h as te,i as se,j as ie,k as y,T as ne}from"./three-BaubxdFU.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=t(s);fetch(s.href,i)}})();const x=new O(0,0,0,"YXZ"),w=new g,oe={type:"change"},ae={type:"lock"},re={type:"unlock"},C=.002,R=Math.PI/2;class le extends U{constructor(e,t=null){super(e,t),this.isLocked=!1,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.pointerSpeed=1,this._onMouseMove=ce.bind(this),this._onPointerlockChange=he.bind(this),this._onPointerlockError=de.bind(this),this.domElement!==null&&this.connect(this.domElement)}connect(e){super.connect(e),this.domElement.ownerDocument.addEventListener("mousemove",this._onMouseMove),this.domElement.ownerDocument.addEventListener("pointerlockchange",this._onPointerlockChange),this.domElement.ownerDocument.addEventListener("pointerlockerror",this._onPointerlockError)}disconnect(){this.domElement.ownerDocument.removeEventListener("mousemove",this._onMouseMove),this.domElement.ownerDocument.removeEventListener("pointerlockchange",this._onPointerlockChange),this.domElement.ownerDocument.removeEventListener("pointerlockerror",this._onPointerlockError)}dispose(){this.disconnect()}getDirection(e){return e.set(0,0,-1).applyQuaternion(this.object.quaternion)}moveForward(e){if(this.enabled===!1)return;const t=this.object;w.setFromMatrixColumn(t.matrix,0),w.crossVectors(t.up,w),t.position.addScaledVector(w,e)}moveRight(e){if(this.enabled===!1)return;const t=this.object;w.setFromMatrixColumn(t.matrix,0),t.position.addScaledVector(w,e)}lock(e=!1){this.domElement.requestPointerLock({unadjustedMovement:e})}unlock(){this.domElement.ownerDocument.exitPointerLock()}}function ce(a){if(this.enabled===!1||this.isLocked===!1)return;const e=this.object;x.setFromQuaternion(e.quaternion),x.y-=a.movementX*C*this.pointerSpeed,x.x-=a.movementY*C*this.pointerSpeed,x.x=Math.max(R-this.maxPolarAngle,Math.min(R-this.minPolarAngle,x.x)),e.quaternion.setFromEuler(x),this.dispatchEvent(oe)}function he(){this.domElement.ownerDocument.pointerLockElement===this.domElement?(this.dispatchEvent(ae),this.isLocked=!0):(this.dispatchEvent(re),this.isLocked=!1)}function de(){console.error("THREE.PointerLockControls: Unable to use Pointer Lock API")}class ue{controls;velocity=new g;direction=new g;moveForward=!1;moveBackward=!1;moveLeft=!1;moveRight=!1;prevTime;constructor(e,t){this.controls=new le(e,t),this.prevTime=performance.now(),e.position.set(8,48,8),this.controls.addEventListener("lock",()=>{console.log("Pointer locked"),document.body.classList.add("locked")}),this.controls.addEventListener("unlock",()=>{console.log("Pointer unlocked"),document.body.classList.remove("locked")}),t.addEventListener("click",()=>{this.controls.isLocked||this.controls.lock()}),document.addEventListener("keydown",n=>this.onKeyDown(n.key)),document.addEventListener("keyup",n=>this.onKeyUp(n.key))}onKeyDown(e){switch(e.toLowerCase()){case"w":this.moveForward=!0;break;case"a":this.moveLeft=!0;break;case"s":this.moveBackward=!0;break;case"d":this.moveRight=!0;break}}onKeyUp(e){switch(e.toLowerCase()){case"w":this.moveForward=!1;break;case"a":this.moveLeft=!1;break;case"s":this.moveBackward=!1;break;case"d":this.moveRight=!1;break}}update(){if(!this.controls.isLocked)return;const e=performance.now(),t=(e-this.prevTime)/1e3,n=10,s=10;this.velocity.x-=this.velocity.x*s*t,this.velocity.z-=this.velocity.z*s*t,this.direction.z=Number(this.moveForward)-Number(this.moveBackward),this.direction.x=Number(this.moveRight)-Number(this.moveLeft),this.direction.normalize(),(this.moveForward||this.moveBackward)&&(this.velocity.z-=this.direction.z*n*s*t),(this.moveLeft||this.moveRight)&&(this.velocity.x-=this.direction.x*n*s*t),this.controls.moveRight(-this.velocity.x*t),this.controls.moveForward(-this.velocity.z*t),this.prevTime=e}}var S=function(){var a=0,e=document.createElement("div");e.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000",e.addEventListener("click",function(c){c.preventDefault(),n(++a%e.children.length)},!1);function t(c){return e.appendChild(c.dom),c}function n(c){for(var d=0;d<e.children.length;d++)e.children[d].style.display=d===c?"block":"none";a=c}var s=(performance||Date).now(),i=s,o=0,r=t(new S.Panel("FPS","#0ff","#002")),h=t(new S.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var u=t(new S.Panel("MB","#f08","#201"));return n(0),{REVISION:16,dom:e,addPanel:t,showPanel:n,begin:function(){s=(performance||Date).now()},end:function(){o++;var c=(performance||Date).now();if(h.update(c-s,200),c>=i+1e3&&(r.update(o*1e3/(c-i),100),i=c,o=0,u)){var d=performance.memory;u.update(d.usedJSHeapSize/1048576,d.jsHeapSizeLimit/1048576)}return c},update:function(){s=this.end()},domElement:e,setMode:n}};S.Panel=function(a,e,t){var n=1/0,s=0,i=Math.round,o=i(window.devicePixelRatio||1),r=80*o,h=48*o,u=3*o,c=2*o,d=3*o,f=15*o,m=74*o,p=30*o,v=document.createElement("canvas");v.width=r,v.height=h,v.style.cssText="width:80px;height:48px";var l=v.getContext("2d");return l.font="bold "+9*o+"px Helvetica,Arial,sans-serif",l.textBaseline="top",l.fillStyle=t,l.fillRect(0,0,r,h),l.fillStyle=e,l.fillText(a,u,c),l.fillRect(d,f,m,p),l.fillStyle=t,l.globalAlpha=.9,l.fillRect(d,f,m,p),{dom:v,update:function(E,I){n=Math.min(n,E),s=Math.max(s,E),l.fillStyle=t,l.globalAlpha=1,l.fillRect(0,0,r,f),l.fillStyle=e,l.fillText(i(E)+" "+a+" ("+i(n)+"-"+i(s)+")",u,c),l.drawImage(v,d+o,f,m-o,p,d,f,m-o,p),l.fillRect(d+m-o,f,o,p),l.fillStyle=t,l.globalAlpha=.9,l.fillRect(d+m-o,f,o,i((1-E/I)*p))}}};const fe={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class D{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const me=new N(-1,1,1,-1,0,1);class pe extends F{constructor(){super(),this.setAttribute("position",new b([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new b([0,2,0,0,2,0],2))}}const ve=new pe;class xe{constructor(e){this._mesh=new L(ve,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,me)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class G extends D{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof _?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=W.clone(e.uniforms),this.material=new _({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new xe(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class A extends D{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){const s=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let o,r;this.inverse?(o=0,r=1):(o=1,r=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),i.buffers.stencil.setFunc(s.ALWAYS,o,4294967295),i.buffers.stencil.setClear(r),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(s.EQUAL,1,4294967295),i.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),i.buffers.stencil.setLocked(!0)}}class we extends D{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class ge{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const n=e.getSize(new k);this._width=n.width,this._height=n.height,t=new X(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:j}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new G(fe),this.copyPass.material.blending=q,this.clock=new V}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let n=!1;for(let s=0,i=this.passes.length;s<i;s++){const o=this.passes[s];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),o.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),o.needsSwap){if(n){const r=this.renderer.getContext(),h=this.renderer.state.buffers.stencil;h.setFunc(r.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),h.setFunc(r.EQUAL,1,4294967295)}this.swapBuffers()}A!==void 0&&(o instanceof A?n=!0:o instanceof we&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new k);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const n=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(n,s),this.renderTarget2.setSize(n,s);for(let i=0;i<this.passes.length;i++)this.passes[i].setSize(n,s)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class Se extends D{constructor(e,t,n=null,s=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=s,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new H}render(e,t,n){const s=e.autoClear;e.autoClear=!1;let i,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),e.autoClear=s}}const Ee={name:"FXAAShader",uniforms:{tDiffuse:{value:null},resolution:{value:new k(1/1024,1/512)}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec2 resolution;
		varying vec2 vUv;

		#define EDGE_STEP_COUNT 6
		#define EDGE_GUESS 8.0
		#define EDGE_STEPS 1.0, 1.5, 2.0, 2.0, 2.0, 4.0
		const float edgeSteps[EDGE_STEP_COUNT] = float[EDGE_STEP_COUNT]( EDGE_STEPS );

		float _ContrastThreshold = 0.0312;
		float _RelativeThreshold = 0.063;
		float _SubpixelBlending = 1.0;

		vec4 Sample( sampler2D  tex2D, vec2 uv ) {

			return texture( tex2D, uv );

		}

		float SampleLuminance( sampler2D tex2D, vec2 uv ) {

			return dot( Sample( tex2D, uv ).rgb, vec3( 0.3, 0.59, 0.11 ) );

		}

		float SampleLuminance( sampler2D tex2D, vec2 texSize, vec2 uv, float uOffset, float vOffset ) {

			uv += texSize * vec2(uOffset, vOffset);
			return SampleLuminance(tex2D, uv);

		}

		struct LuminanceData {

			float m, n, e, s, w;
			float ne, nw, se, sw;
			float highest, lowest, contrast;

		};

		LuminanceData SampleLuminanceNeighborhood( sampler2D tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData l;
			l.m = SampleLuminance( tex2D, uv );
			l.n = SampleLuminance( tex2D, texSize, uv,  0.0,  1.0 );
			l.e = SampleLuminance( tex2D, texSize, uv,  1.0,  0.0 );
			l.s = SampleLuminance( tex2D, texSize, uv,  0.0, -1.0 );
			l.w = SampleLuminance( tex2D, texSize, uv, -1.0,  0.0 );

			l.ne = SampleLuminance( tex2D, texSize, uv,  1.0,  1.0 );
			l.nw = SampleLuminance( tex2D, texSize, uv, -1.0,  1.0 );
			l.se = SampleLuminance( tex2D, texSize, uv,  1.0, -1.0 );
			l.sw = SampleLuminance( tex2D, texSize, uv, -1.0, -1.0 );

			l.highest = max( max( max( max( l.n, l.e ), l.s ), l.w ), l.m );
			l.lowest = min( min( min( min( l.n, l.e ), l.s ), l.w ), l.m );
			l.contrast = l.highest - l.lowest;
			return l;

		}

		bool ShouldSkipPixel( LuminanceData l ) {

			float threshold = max( _ContrastThreshold, _RelativeThreshold * l.highest );
			return l.contrast < threshold;

		}

		float DeterminePixelBlendFactor( LuminanceData l ) {

			float f = 2.0 * ( l.n + l.e + l.s + l.w );
			f += l.ne + l.nw + l.se + l.sw;
			f *= 1.0 / 12.0;
			f = abs( f - l.m );
			f = clamp( f / l.contrast, 0.0, 1.0 );

			float blendFactor = smoothstep( 0.0, 1.0, f );
			return blendFactor * blendFactor * _SubpixelBlending;

		}

		struct EdgeData {

			bool isHorizontal;
			float pixelStep;
			float oppositeLuminance, gradient;

		};

		EdgeData DetermineEdge( vec2 texSize, LuminanceData l ) {

			EdgeData e;
			float horizontal =
				abs( l.n + l.s - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.se - 2.0 * l.e ) +
				abs( l.nw + l.sw - 2.0 * l.w );
			float vertical =
				abs( l.e + l.w - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.nw - 2.0 * l.n ) +
				abs( l.se + l.sw - 2.0 * l.s );
			e.isHorizontal = horizontal >= vertical;

			float pLuminance = e.isHorizontal ? l.n : l.e;
			float nLuminance = e.isHorizontal ? l.s : l.w;
			float pGradient = abs( pLuminance - l.m );
			float nGradient = abs( nLuminance - l.m );

			e.pixelStep = e.isHorizontal ? texSize.y : texSize.x;

			if (pGradient < nGradient) {

				e.pixelStep = -e.pixelStep;
				e.oppositeLuminance = nLuminance;
				e.gradient = nGradient;

			} else {

				e.oppositeLuminance = pLuminance;
				e.gradient = pGradient;

			}

			return e;

		}

		float DetermineEdgeBlendFactor( sampler2D  tex2D, vec2 texSize, LuminanceData l, EdgeData e, vec2 uv ) {

			vec2 uvEdge = uv;
			vec2 edgeStep;
			if (e.isHorizontal) {

				uvEdge.y += e.pixelStep * 0.5;
				edgeStep = vec2( texSize.x, 0.0 );

			} else {

				uvEdge.x += e.pixelStep * 0.5;
				edgeStep = vec2( 0.0, texSize.y );

			}

			float edgeLuminance = ( l.m + e.oppositeLuminance ) * 0.5;
			float gradientThreshold = e.gradient * 0.25;

			vec2 puv = uvEdge + edgeStep * edgeSteps[0];
			float pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
			bool pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !pAtEnd; i++ ) {

				puv += edgeStep * edgeSteps[i];
				pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
				pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			}

			if ( !pAtEnd ) {

				puv += edgeStep * EDGE_GUESS;

			}

			vec2 nuv = uvEdge - edgeStep * edgeSteps[0];
			float nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
			bool nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !nAtEnd; i++ ) {

				nuv -= edgeStep * edgeSteps[i];
				nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
				nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			}

			if ( !nAtEnd ) {

				nuv -= edgeStep * EDGE_GUESS;

			}

			float pDistance, nDistance;
			if ( e.isHorizontal ) {

				pDistance = puv.x - uv.x;
				nDistance = uv.x - nuv.x;

			} else {

				pDistance = puv.y - uv.y;
				nDistance = uv.y - nuv.y;

			}

			float shortestDistance;
			bool deltaSign;
			if ( pDistance <= nDistance ) {

				shortestDistance = pDistance;
				deltaSign = pLuminanceDelta >= 0.0;

			} else {

				shortestDistance = nDistance;
				deltaSign = nLuminanceDelta >= 0.0;

			}

			if ( deltaSign == ( l.m - edgeLuminance >= 0.0 ) ) {

				return 0.0;

			}

			return 0.5 - shortestDistance / ( pDistance + nDistance );

		}

		vec4 ApplyFXAA( sampler2D  tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData luminance = SampleLuminanceNeighborhood( tex2D, texSize, uv );
			if ( ShouldSkipPixel( luminance ) ) {

				return Sample( tex2D, uv );

			}

			float pixelBlend = DeterminePixelBlendFactor( luminance );
			EdgeData edge = DetermineEdge( texSize, luminance );
			float edgeBlend = DetermineEdgeBlendFactor( tex2D, texSize, luminance, edge, uv );
			float finalBlend = max( pixelBlend, edgeBlend );

			if (edge.isHorizontal) {

				uv.y += edge.pixelStep * finalBlend;

			} else {

				uv.x += edge.pixelStep * finalBlend;

			}

			return Sample( tex2D, uv );

		}

		void main() {

			gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );

		}`};class ye{scene;camera;renderer;canvas;composer;fxaaPass;stats;constructor(e){this.canvas=e,this.scene=new Q,this.scene.background=new H(8900331),this.camera=new Y(75,window.innerWidth/window.innerHeight,.1,1e3),this.renderer=new K({canvas:this.canvas,antialias:!1}),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.setPixelRatio(window.devicePixelRatio),this.composer=new ge(this.renderer);const t=new Se(this.scene,this.camera);this.composer.addPass(t),this.fxaaPass=new G(Ee),this.fxaaPass.material.uniforms.resolution.value.x=1/(window.innerWidth*window.devicePixelRatio),this.fxaaPass.material.uniforms.resolution.value.y=1/(window.innerHeight*window.devicePixelRatio),this.composer.addPass(this.fxaaPass);const n=new Z(16777215,.6);this.scene.add(n);const s=new $(16777215,1);s.position.set(50,100,50),s.target.position.set(0,0,0),this.scene.add(s),window.addEventListener("resize",()=>this.onResize()),this.stats=new S,this.stats.dom.style.position="absolute",this.stats.dom.style.top="0px",this.stats.dom.style.left="0px",document.body.appendChild(this.stats.dom)}onResize(){this.camera.aspect=window.innerWidth/window.innerHeight,this.camera.updateProjectionMatrix(),this.renderer.setSize(window.innerWidth,window.innerHeight),this.composer.setSize(window.innerWidth,window.innerHeight),this.fxaaPass.material.uniforms.resolution.value.x=1/(window.innerWidth*window.devicePixelRatio),this.fxaaPass.material.uniforms.resolution.value.y=1/(window.innerHeight*window.devicePixelRatio)}render(e){e.update(),this.composer.render(),this.stats.update()}}const ke=0,De=3,B=16,Le=16,T=16,z=4,M=4,be=2;class _e{renderer;player;worker;chunks=new Map;requestedChunks=new Set;texture;chunkMaterial;raycaster=new J;selectionBox;selectedBlock={position:new g,normal:new g,exists:!1};constructor(e,t,n){this.renderer=e,this.player=t,this.texture=n,this.texture.magFilter=P,this.texture.minFilter=P,this.chunkMaterial=new ee({map:this.texture,side:te});const s=new se(1.001,1.001,1.001),i=new ie({color:16777215,wireframe:!0,transparent:!0,opacity:.5});this.selectionBox=new L(s,i),this.selectionBox.visible=!1,this.renderer.scene.add(this.selectionBox),this.worker=new Worker(new URL(""+new URL("WorldWorker-D6JVPDTf.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.onmessage=o=>{o.data.type==="chunkMesh"&&this.addChunkMesh(o.data.chunkKey,o.data.mesh),o.data.type==="worldLoaded"&&(document.getElementById("loading-screen").classList.add("hidden"),this.loadChunksAroundPlayer())},this.worker.postMessage({type:"loadWorld"})}addChunkMesh(e,t){if(this.chunks.has(e)){const h=this.chunks.get(e);this.renderer.scene.remove(h),h.geometry.dispose()}const n=new F;n.setAttribute("position",new y(new Float32Array(t.positions),3)),n.setAttribute("normal",new y(new Float32Array(t.normals),3)),n.setAttribute("uv",new y(new Float32Array(t.uvs),2)),n.setIndex(new y(new Uint32Array(t.indices),1));const s=new L(n,this.chunkMaterial),[i,o,r]=e.split(",").map(Number);s.position.set(i*B,o*Le,r*T),s.name=e,this.chunks.set(e,s),this.renderer.scene.add(s),this.requestedChunks.delete(e)}update(){this.loadChunksAroundPlayer(),this.updateRaycaster()}loadChunksAroundPlayer(){const[e,t]=this.getPlayerChunkPosition();for(let n=-z;n<=z;n++)for(let s=-M;s<=M;s++)for(let i=0;i<be;i++){const o=e+n,r=i,h=t+s,u=`${o},${r},${h}`;if(!this.chunks.has(u)&&!this.requestedChunks.has(u)){this.requestedChunks.add(u);const c={type:"generate",chunkX:o,chunkY:r,chunkZ:h,chunkKey:u};this.worker.postMessage(c)}}}getPlayerChunkPosition(){const e=this.player.controls.object.position,t=Math.floor(e.x/B),n=Math.floor(e.z/T);return[t,n]}updateRaycaster(){if(!this.player.controls.isLocked){this.selectionBox.visible=!1,this.selectedBlock.exists=!1;return}this.raycaster.setFromCamera(new k(0,0),this.renderer.camera);const e=this.raycaster.intersectObjects(Array.from(this.chunks.values()),!1);if(e.length>0){const t=e[0],n=t.point,s=t.face.normal,i=new g(Math.floor(n.x-s.x*.5),Math.floor(n.y-s.y*.5),Math.floor(n.z-s.z*.5));this.selectionBox.position.set(i.x+.5,i.y+.5,i.z+.5),this.selectionBox.visible=!0,this.selectedBlock.position.copy(i),this.selectedBlock.normal.copy(s),this.selectedBlock.exists=!0}else this.selectionBox.visible=!1,this.selectedBlock.exists=!1}breakBlock(){if(!this.selectedBlock.exists)return;const{x:e,y:t,z:n}=this.selectedBlock.position,s={type:"setBlock",worldX:e,worldY:t,worldZ:n,blockId:ke};this.worker.postMessage(s)}placeBlock(){if(!this.selectedBlock.exists)return;const{position:e,normal:t}=this.selectedBlock,n=e.x+t.x,s=e.y+t.y,i=e.z+t.z,o={type:"setBlock",worldX:n,worldY:s,worldZ:i,blockId:De};this.worker.postMessage(o)}saveWorld(){console.log("Main: ワールド保存をリクエスト..."),this.worker.postMessage({type:"saveWorld"})}}async function Pe(){const a=document.getElementById("main-canvas");if(!a)throw new Error("Canvas element not found");const e=new ye(a),t=new ue(e.camera,a),s=await new ne().loadAsync("../public/assets/img/textures.png");console.log("Main: テクスチャ読み込み完了");const i=new _e(e,t,s);a.addEventListener("mousedown",h=>{if(t.controls.isLocked)switch(h.button){case 0:i.breakBlock();break;case 2:i.placeBlock();break}}),a.addEventListener("contextmenu",h=>h.preventDefault()),document.getElementById("save-button").addEventListener("click",()=>{i.saveWorld()});function r(){requestAnimationFrame(r),i.update(),e.render(t)}r(),console.log("Main: アプリケーション初期化完了")}Pe().catch(console.error);
