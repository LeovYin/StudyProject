// 定义一个立即执行函数，传入 jQuery 对象、window 对象、document 对象
!function (t, a, e, i) {
    // 定义分页组件的构造函数
    var n = function (a, e) {
        // 初始化组件的元素和默认选项
        this.ele = a; // 分页组件的容器元素
        this.defaults = {
            currentPage: 1, // 当前页码
            totalPage: 10, // 总页数
            isShow: !0, // 是否显示分页组件
            count: 5, // 显示的页码数量
            homePageText: "首页", // 首页按钮的文本
            endPageText: "尾页", // 尾页按钮的文本
            prevPageText: "上一页", // 上一页按钮的文本
            nextPageText: "下一页", // 下一页按钮的文本
            callback: function () {
            } // 点击页码时的回调函数
        };
        this.opts = t.extend({}, this.defaults, e); // 合并默认选项和用户传入的选项
        this.current = this.opts.currentPage; // 当前页码
        this.total = this.opts.totalPage; // 总页数
        this.init(); // 初始化组件
    };

    // 定义分页组件的原型方法
    n.prototype = {
        init: function () {
            this.render(); // 渲染分页组件
            this.eventBind(); // 绑定事件
        },
        render: function () {
            var t = this.opts, a = this.current, e = this.total, i = this.getPagesTpl(), n = this.ele.empty();
            this.isRender = !0; // 标记是否渲染
            this.homePage = '<a href="javascript:void(0);" class="ui-pagination-page-item" data-current="1">' + t.homePageText + "</a>"; // 首页按钮
            this.prevPage = '<a href="javascript:void(0);" class="ui-pagination-page-item" data-current="' + (a - 1) + '">' + t.prevPageText + "</a>"; // 上一页按钮
            this.nextPage = '<a href="javascript:void(0);" class="ui-pagination-page-item" data-current="' + (a + 1) + '">' + t.nextPageText + "</a>"; // 下一页按钮
            this.endPage = '<a href="javascript:void(0);" class="ui-pagination-page-item" data-current="' + e + '">' + t.endPageText + "</a>"; // 尾页按钮
            this.checkPage(); // 检查页码状态
            this.isRender && n.html("<div class='ui-pagination-container'>" + this.homePage + this.prevPage + i + this.nextPage + this.endPage + "</div>"); // 渲染分页组件
        },
        checkPage: function () {
            var t = this.opts, a = this.total, e = this.current;
            t.isShow || (this.homePage = this.endPage = ""); // 如果不显示分页组件，则隐藏首页和尾页按钮
            1 === e && (this.homePage = this.prevPage = ""); // 如果当前页是第一页，则隐藏首页和上一页按钮
            e === a && (this.endPage = this.nextPage = ""); // 如果当前页是最后一页，则隐藏尾页和下一页按钮
            1 === a && (this.homePage = this.prevPage = this.endPage = this.nextPage = ""); // 如果只有一页，则隐藏所有按钮
            a <= 1 && (this.isRender = !1); // 如果总页数小于等于1，则不渲染分页组件
        },
        getPagesTpl: function () {
            var t = this.opts, a = this.total, e = this.current, i = "", n = t.count;
            if (a <= n) {
                for (g = 1; g <= a; g++) {
                    i += g === e ? '<a href="javascript:void(0);" class="ui-pagination-page-item active" data-current="' + g + '">' + g + "</a>" : '<a href="javascript:void(0);" class="ui-pagination-page-item" data-current="' + g + '">' + g + "</a>";
                }
            } else {
                var s = n / 2;
                if (e <= s) {
                    for (g = 1; g <= n; g++) {
                        i += g === e ? '<a href="javascript:void(0);" class="ui-pagination-page-item active" data-current="' + g + '">' + g + "</a>" : '<a href="javascript:void(0);" class="ui-pagination-page-item" data-current="' + g + '">' + g + "</a>";
                    }
                } else {
                    var r = Math.floor(s), h = e + r, o = e - r, c = n % 2 == 0;
                    h > a && (c ? (o -= h - a - 1, h = a + 1) : (o -= h - a, h = a)), c || h++;
                    for (var g = o; g < h; g++) {
                        i += g === e ? '<a href="javascript:void(0);" class="ui-pagination-page-item active" data-current="' + g + '">' + g + "</a>" : '<a href="javascript:void(0);" class="ui-pagination-page-item" data-current="' + g + '">' + g + "</a>";
                    }
                }
            }
            return i;
        },
        setPage: function (t, a) {
            return t === this.current && a === this.total ? this.ele : (this.current = t, this.total = a, this.render(), this.ele); // 设置当前页码和总页数
        },
        getPage: function () {
            return {current: this.current, total: this.total}; // 获取当前页码和总页数
        },
        eventBind: function () {
            var a = this, e = this.opts.callback;
            this.ele.off("click").on("click", ".ui-pagination-page-item", function () {
                var i = t(this).data("current");
                a.current != i && (a.current = i, a.render(), e && "function" == typeof e && e(i)); // 点击页码时更新当前页码并重新渲染分页组件
            });
        }
    };

    // 定义 jQuery 插件
    t.fn.pagination = function (t, a, e) {
        if ("object" == typeof t) {
            var i = new n(this, t); // 创建分页组件实例
            this.data("pagination", i); // 将实例存储在元素的数据中
        }
        return "string" == typeof t ? this.data("pagination")[t](a, e) : this; // 支持通过字符串调用实例方法
    };
}(jQuery, window, document);
let data = [];

// 分页函数
function paginateData(data, page, pageSize) {
    var start = (page - 1) * pageSize;
    var end = start + pageSize;
    return data.slice(start, end);
}

// 渲染表格
function renderTable(data) {
    var html = '';
    data.forEach(function (item) {
        html += '<tr>';
        html += '<td>' + item.year + '</td>';
        html += '<td>' + item.date + '</td>';
        html += '<td>' + item.level + '</td>';
        html += '<td>' + item.traffic + '</td>';
        html += '<td>' + item.flow_rate + '</td>';
        html += '<td>' + item.water_temperature + '</td>';
        html += '<td>' + item.number + '</td>';
        html += '</tr>';
    });
    $('#data-container').html(html);

    // 动态调整表格高度
    adjustTableHeight();
}

// 动态调整表格高度
function adjustTableHeight() {
    var rows = $('#data-container tr').length;
    var rowHeight = 40; // 每行的高度
    var tableHeight = rows * rowHeight;
    $('.table_p').height(tableHeight);
}

// 初始化分页组件
$(document).ready(function () {
    var pageSize = 15; // 每页显示的数据条数
    var totalPage = 0; // 总页数
    var currentPage = 1; // 当前页码

    // 从后端获取数据
    function fetchData(page) {
        $.getJSON('/paginate', {page: page}, function (response) {
            data = response.data;
            totalPage = Math.ceil(response.total / pageSize);
            renderTable(data);
            if ($('#pagination').data('pagination')) {
                $('#pagination').pagination('setPage', page, totalPage);
            } else {
                $('#pagination').pagination({
                    totalPage: totalPage,
                    callback: function (page) {
                        fetchData(page);
                    }
                });
            }
        });
    }

    // 初始加载第一页数据
    fetchData(currentPage);
// 搜索功能
    $('#search-form').on('submit', function () {
        var year = $('.search-input').val();
        $.getJSON('/search', {year: year}, function (response) {
            data = response.data;
            totalPage = Math.ceil(response.total / pageSize);
            currentPage = 1; // 重置分页到第一页
            renderTable(data);
            $('#pagination').pagination('setPage', currentPage, totalPage);
        });
        return false; // 阻止表单默认提交行为
    });
});