﻿$include('/storage/data/view-type-json.js');


// 页面初始化事件调用函数
function init() {
    viewInit();
}


// 文件查看初始化
function viewInit() {
    var id = $query('id');
    var codeId = $query('codeid');
    var extension = $query('extension');
    var data = 'id=' + id;
    var type;
    var url;

    type = viewType(extension);

    url = window.location.protocol + '//' + window.location.host + '/drive/file/' + id + '-' + codeId;

    $ajax({
        type: 'HEAD', 
        url: '/web/drive/file/file-view.ashx?id=' + id + '&codeid=' + codeId, 
        async: true, 
        callback: function(http) {
            if (http.status == 200) {
                if (type == 'msoffice' || type == 'openoffice' || type == 'wps' || type == 'text' || type == 'pdf' || type == 'drawing') {
                    viewPdf(url + '.pdf');
                } else if (type == 'code') {
                    viewCode(url + '.code');
                } else if (type == 'image') {
                    if (extension == '.tif' || extension == '.tiff') {
                        viewPdf(url + '.pdf');
                    } else {
                        viewImage(url + '.jpg');
                    }
                } else if (type == 'audio' || type == 'video') {
                    viewMedia(url + '.flv');
                } else if (type == 'zip') {
                    viewZip(id);
                } else {
                    viewDetail(id);
                }
            } else if (http.status == 403) {
                fastui.coverTips(lang.file.tips['view-waiting-convert']);
            } else if (http.status == 404) {
                fastui.coverTips(lang.file.tips['unexist-or-error']);
            } else {
                fastui.coverTips(lang.file.tips['operation-failed']);
            }

            fastui.coverHide('loading-cover');
            }
        });

    fastui.coverShow('loading-cover');
}


// 获取文件类型
function viewType(extension) {
    var extensions;
    var i;
    var j;
    var n;

    for (i in viewTypeJson.extension) {
        if (typeof(viewTypeJson.extension[i]) != "string") {
            for (j in viewTypeJson.extension[i]) {
                extensions = new Array();

                extensions = viewTypeJson.extension[i][j].split(',');

                for (n = 0; n < extensions.length; n++) {
                    if (extensions[n] == extension.substring(1)) {
                        return i;
                    }
                }
            }
        } else {
            extensions = new Array();

            extensions = viewTypeJson.extension[i].split(',');

            for (j = 0; j < extensions.length; j++) {
                if (extensions[j] == extension.substring(1)) {
                    return i;
                }
            }
        }
    }

    return 'other';
}


// pdf格式查看
function viewPdf(url) {
    if ($html5() == true) {
        $location('/libs/pdfjs/viewer.html?file=' + encodeURIComponent(url));
    } else {
        fastui.coverTips(lang.file.tips['view-browser-unsupport']);
    }
}


// 代码格式查看
function viewCode(url) {
    var container;
    var box;

    container = $create({
        tag: 'div', 
        attr: {id: 'code-viewer'}
        }).$add(document.body);

    box = $create({
        tag: 'ul'
        }).$add(container);

    $ajax({
        type: 'GET', 
        url: url, 
        async: true, 
        callback: function(data) {
            var code = new Array();
            var line;
            var i;

            if (data.length == 0) {
                $location('/web/drive/file/file-detail.html?id=' + $query('id'));
            } else {
                data = data.replace(/</g, '&lt;');
                data = data.replace(/>/g, '&gt;');

                code = data.split(/\r\n?/);

                for (i = 0; i < code.length; i++) {
                    line = $create({
                        tag: 'li', 
                        html: '<div class=\"line-number\">' + (i + 1) + '</div><div class=\"line-text\">' + code[i] + '</div>'
                        }).$add(box);
                }
            }
            }
        });
}


// 图片格式查看
function viewImage(url) {
    var preloadImage = new Image();
    var clientWidth = $page().client.width;
    var clientHeight = $page().client.height;
    var method = {};
    var container;
    var image;

    container = $create({
        tag: 'div', 
        attr: {id: 'image-viewer'}
        }).$add(document.body);

    image = $create({
        tag: 'img', 
        attr: {id: 'image'}, 
        style: {visibility: 'hidden'}
        }).$add(container);

    // ie浏览器采用image对象预加载处理
    if ((!!window.ActiveXObject || 'ActiveXObject' in window) == true) {
        preloadImage.onload = function() {
            image.onload = function() {
                method.view();
            };

            image.src = url;
        };

        preloadImage.src = url;
    } else {
        image.onload = function() {
            method.view();
        };

        image.src = url;
    }

    method.view = function() {
        image.height = clientHeight - 96;

        if (image.width > clientWidth) {
            image.removeAttribute('height');

            image.width = clientWidth - 96;
        }

        image.style.visibility = 'visible';
        image.style.top = Math.ceil((clientHeight - image.offsetHeight) / 2) + 'px';
        image.style.left = Math.ceil((clientWidth - image.offsetWidth) / 2) + 'px';

        // 鼠标拖动图片
        method.drag = function(img) {
            var control;

            // 拖动控制元素
            control = $create({
                tag: 'div', 
                attr: {id: 'cover'}
                }).$add(container);

            // 点击进入拖动状态
            control.onmousedown = function(event) {
                var event = event || window.event;
                var dragging = false;
                var top;
                var left;
                var x;
                var y;

                top = parseInt(img.style.top + 0, 10);
                left = parseInt(img.style.left + 0, 10);
                x = event.clientX;
                y = event.clientY;

                dragging = true;

                // 鼠标拖动
                control.onmousemove = function(event) {
                    if (dragging == true) {
                        var event = event || window.event;

                        img.style.top = (top + event.clientY - y) + 'px';
                        img.style.left = (left + event.clientX - x) + 'px';
                    }
                    };

                // 鼠标释放
                control.onmouseup = function() {
                    control.onmousemove = null;

                    dragging = false;
                    };
                    
                return false;
                };
            };

        method.drag(image);

        // 鼠标滚动绽放图片
        method.scale = function(event) {
            var event = event || window.event;
            var width;
            var height;

            if (event.wheelDelta > 0) {
                width = Math.round(image.offsetWidth + (image.offsetWidth * 0.1));
                height = Math.round(image.offsetHeight + (image.offsetHeight * 0.1));
            } else if (event.wheelDelta < 0) {
                width = Math.round(image.offsetWidth - (image.offsetWidth * 0.1));
                height = Math.round(image.offsetHeight - (image.offsetHeight * 0.1));
            } else if (event.detail < 0) {
                width = Math.round(image.offsetWidth + (image.offsetWidth * 0.1));
                height = Math.round(image.offsetHeight + (image.offsetHeight * 0.1));
            } else if (event.detail > 0) {
                width = Math.round(image.offsetWidth - (image.offsetWidth * 0.1));
                height = Math.round(image.offsetHeight - (image.offsetHeight * 0.1));
            }

            image.style.top = Math.ceil(($page().client.height - image.offsetHeight) / 2) + 'px';
            image.style.left = Math.ceil(($page().client.width - image.offsetWidth) / 2) + 'px';

            image.width = width;

            image.removeAttribute('height');
        };

        document.onmousewheel = method.scale;

        if (document.addEventListener) {
            document.addEventListener('DOMMouseScroll', method.scale, false);
        }

        fastui.textTips(lang.file.tips['view-image-control'], 5000, 8);
    };
}


// 多媒体格式查看
function viewMedia(url) {
    var flash = null;
    var html = '';

    if ((!!window.ActiveXObject || 'ActiveXObject' in window) == true) {
        flash = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
    } else {
        flash = navigator.plugins['Shockwave Flash'];
    }

    if (flash ? true : false == false) {
        fastui.coverTips('Flash is not supported');
        return;
    }

    if ($agent(/(iOS|iPhone|iPad|iPod|Android|Windows Phone|SymbianOS)/i) == false) {
        html += '<object id=\"flv-player\" classid=\"clsid:D27CDB6E-AE6D-11CF-96B8-444553540000\" codebase=\"http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,0,0\" width=\"100%\" height=\"100%\" bgcolor=\"#000000\">';
        html += '<param name=\"movie\" value=\"/libs/flvplayer/flvplayer.swf\" />';
        html += '<param name=\"quality\" value=\"high\" />';
        html += '<param name=\"scale\" value=\"noscale\" />';
        html += '<param name=\"wmode\" value=\"opaque\" />';
        html += '<param name=\"autoplay\" value=\"false\" />';
        html += '<param name=\"allowfullscreen\" value=\"true\" />';
        html += '<param name=\"flashvars\" value=\"flv=' + url + '&autoplay=0&autoload=1&buffer=15&margin=0&showvolume=1&showtime=1&showfullscreen=1&showiconplay=1\" />';
        html += '<embed src=\"/libs/flvplayer/flvplayer.swf\" flashvars=\"flv=' + url + '&autoplay=0&autoload=1&buffer=15&margin=0&showvolume=1&showtime=1&showfullscreen=1&showiconplay=1\" quality=\"high\" scale=\"noscale\" wmode=\"opaque\" allowfullscreen=\"true\" width=\"100%\" height=\"100%\" type=\"application/x-shockwave-flash\" pluginspage=\"http://www.macromedia.com/go/getflashplayer\" /></embed>';
        html += '</object>';

        document.body.innerHTML = html;
    } else {
        document.body.innerHTML = '<embed id=\"flv-player\" src=\"' + url + '\" width=\"0\" height=\"0\" /></embed>';

        window.setTimeout(function() {
            $location('/web/drive/file/file-detail.html?id=' + $query('id'));
            }, 1000);
    }
}


// 压缩格式查看
function viewZip(id) {
    $location('/web/drive/file/zip-view.html?id=' + id);
}


// 文件详细属性查看
function viewDetail(id) {
    $location('/web/drive/file/file-detail.html?id=' + id);
}