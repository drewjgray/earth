module.exports = {
    chainWebpack: config => {
        config.module
            .rule('glsl')
            .test(/\.(glsl|vs|fs|vert|frag)$/)
            .use('raw-loader')
            .loader('raw-loader')
            .end()
    }
}