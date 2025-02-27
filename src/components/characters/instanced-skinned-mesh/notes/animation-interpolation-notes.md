# Animation interpolation

Our current implenentation on instanced-skinned-mesh bakes all the bones matrices for each frame into a texture.

Then, that texture is sampled to get the matrix for each bone for a specific frame.

Since we have to select an "FPS resolution" to smaple our animations, if we want to have smoother animations, we need to increase the texture size.

This creates a problem on screens with high refresh rates, sice in order to have smoother animations the processing power needed is too high.

To solve this issue, there are two possible solutions:

1. Interpolate the animation on the GPU.
2. Calculate the bones matrices on the fly for each instance.

## Interpolation on the GPU

Currently we are storing the bone matrix of each frame on the `boneTexture`.

This texture contains a bone position for each frame of each bone of each animation.

To sample that texture we are using the `batchingKeyframeTexture` DataTexture. This texture will indicate where in the `boneTexture` we should sample the bone matrices from.

This solution solves the problem but we dont know the next frame of our animation, so we can't interpolate between frames.

A possible solution is to have a second texture called `batchingKeyframeTextureB` that will store a second position for each frame.

Then, we should have a third texture that will store the interpolation factor between the two frames: `batchingInterpolationTexture`.

This will enable us not only to interpolate between frames, but also to interpolate between animations.

### Caveats

If we want to interpolate between animations, we will loose the "smoothness" of the frame interpolation.

But it will be a good compromise between performance and quality.

## Calculate the bones matrices on the fly

This solution will be to calculate the bones matrices on the fly for each instance.

To solve this, we will need to store an array of animation mixers for each instance.

And, on every frame, loop over all instances, update the bone matrices and store the matrix information in a buffer.

This will reduce the work of pre-baking every animation and will also enable us to interpolate between animations using the THREE.AnimationMixer.

### Caveats

This solution will be more demanding on the CPU, but it will be more flexible and will not depend on the texture size.
