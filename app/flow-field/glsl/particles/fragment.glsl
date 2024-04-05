uniform sampler2D uColorTexture;

varying vec3 vColor;
varying vec2 vUv;

void main()
{

    vec4 textureColor = texture2D(uColorTexture, vUv);
    float distanceToCenter = length(gl_PointCoord - 0.5);
    if(distanceToCenter > 0.5)
        discard;
    
    gl_FragColor = textureColor;

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}