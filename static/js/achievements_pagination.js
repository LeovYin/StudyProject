!function (t, a, e, i) {
    var n = function (a, e) {
        this.ele = a;
        this.defaults = {
            currentPage: 1,
            totalPage: 10,
            isShow: !0,
            count: 7,
            homePageText: "首页",
            endPageText: "尾页",
            prevPageText: "上一页",
            nextPageText: "下一页",
            callback: function () {
            }
        };
        this.opts = t.extend({}, this.defaults, e);
        this.current = Math.min(Math.max(this.opts.currentPage, 1), this.opts.totalPage);
        this.total = this.opts.totalPage;
        this.init();
    };

    n.prototype = {
        init: function () {
            this.render();
            this.eventBind();
        },
        render: function () {
            var t = this.opts,
                a = this.current,
                e = this.total,
                n = this.ele.empty();

            this.isRender = !0;
            this.homePage = this.createPageItem(1, t.homePageText);
            this.prevPage = this.createPageItem(a - 1, t.prevPageText);
            this.nextPage = this.createPageItem(a + 1, t.nextPageText);
            this.endPage = this.createPageItem(e, t.endPageText);

            this.checkPage();
            var i = this.getPagesTpl();
            this.isRender && n.html(`<div class='ui-pagination-container'>
                ${this.homePage}${this.prevPage}${i}${this.nextPage}${this.endPage}
            </div>`);
        },
        createPageItem: function (page, text) {
            return `<a href="javascript:;" class="ui-pagination-page-item" 
                     data-current="${page}">${text}</a>`;
        },
        checkPage: function () {
            var t = this.total, a = this.current;
            this.current = Math.min(Math.max(a, 1), t);
            this.homePage = a > 1 ? this.homePage : "";
            this.prevPage = a > 1 ? this.prevPage : "";
            this.nextPage = a < t ? this.nextPage : "";
            this.endPage = a < t ? this.endPage : "";
            if (t <= 1) this.isRender = !1;
        },
        getPagesTpl: function () {
            var t = this.opts.count,
                a = this.total,
                e = this.current,
                n = Math.floor(t / 2),
                r = [];

            let start = Math.max(1, e - n);
            let end = Math.min(a, e + n);

            if (start > 1) r.push('<span class="ellipsis">...</span>');
            for (let i = start; i <= end; i++) {
                r.push(`<a href="javascript:;" class="ui-pagination-page-item ${i === e ? 'active' : ''}" 
                          data-current="${i}">${i}</a>`);
            }
            if (end < a) r.push('<span class="ellipsis">...</span>');

            return r.join('');
        },
        setPage: function (t, a) {
            this.current = Math.min(Math.max(t, 1), a);
            this.total = a;
            this.render();
            return this.ele;
        },
        eventBind: function () {
            var a = this, e = this.opts.callback;
            this.ele.off("click").on("click", ".ui-pagination-page-item", function () {
                var i = parseInt(t(this).data("current"));
                if (!isNaN(i) && i !== a.current) {
                    a.current = Math.min(Math.max(i, 1), a.total);
                    a.render();
                    e(a.current);
                }
            });
        }
    };

    t.fn.pagination = function (t, a, e) {
        if ("object" == typeof t) {
            var i = new n(this, t);
            this.data("pagination", i);
        }
        return "string" == typeof t ? this.data("pagination")[t](a, e) : this;
    };
}(jQuery, window, document);

$(document).ready(function () {
    let pageSize = 12;
    let currentPage = 1;
    let totalPage = 0;
    let paginationInstance = null;

    function initPagination() {
        $('#achievements-pagination').pagination({
            totalPage: totalPage,
            currentPage: currentPage,
            callback: function (page) {
                currentPage = page;
                fetchData(page);
            }
        });
        paginationInstance = $('#achievements-pagination').data('pagination');
    }

    function fetchData(page) {
        let url = '/achievements_paginate';
        let data = {page: page};
        $.getJSON(url, data, function (response) {
            totalPage = Math.ceil(response.total / pageSize);
            if (!paginationInstance) {
                initPagination();
            } else {
                paginationInstance.setPage(page, totalPage);
            }
            console.log('response.data',response.data)
            renderTable(response.data);
        });
    }

    function renderTable(data) {
        let html = '';
        data.forEach(function (item) {
            html += '<tr class="achievements-tr">';
            html += '<td class="extended-title-cell">' + item.title + '</td>>';
            html += '<td class="extended-describe-column">' + item.description + '</td>';
            html += '<td class="compact-score-column">' + item.point + '</td>';
            var className = 'compact-condition-column';
            if (item.conditions !== '已满足条件') {
                className += ' not-met';
            }
            html += '<td class="' + className + '">' + item.conditions + '</td>';
            var buttonClass = 'claim-button';
            var buttonDisabled = item.is_success ? 'disabled' : '';
            var buttonContent = item.is_success ? '✅ 已领取' : '领取';
            html += '<td class="compact-claim-cell">';
            html += '<button class="' + buttonClass + '" data-achievement-id="' + item.id + '" ' + buttonDisabled + '>';
            html += buttonContent;
            html += '</button>';
            html += '</td>';
            html +='</tr>'
        });
        $('#achievement-data-container').html(html);
        adjustTableHeight();
    }

    function adjustTableHeight() {
        var rows = $('#achievement-data-container .achievements-tr').length;
        var rowHeight = 40;
        var tableHeight = rows * rowHeight;
        $('.table_p').height(tableHeight);
    }

    fetchData(currentPage); // 初始加载
});
