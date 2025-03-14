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
    let currentSearchType = null; // 当前搜索类型
    let startDate = null;
    let endDate =null;
    let selection = null;

    // 初始化分页
    function initPagination() {
        $('#pagination').pagination({
            totalPage: totalPage,
            currentPage: currentPage,
            callback: function (page) {
                currentPage = page;
                if (currentSearchType) {
                    fetchData(page, currentSearchType);
                } else if (startDate && endDate) {
                    fetchDateRangeData(page, startDate, endDate);
                } else {
                    fetchData(page);
                }
            }
        });
        paginationInstance = $('#pagination').data('pagination');
    }

    $('.date-form').on('submit', function (e) {
        e.preventDefault(); // 阻止表单默认提交行为
        startDate = $('#pre_datepicker').val();
        endDate = $('#end_datepicker').val();
        selection = $('#action_select').val();
        fetchDateRangeData(1,startDate, endDate, selection);
    });1

    function fetchData(page, searchType) {
        let url = '/records_paginate';
        let data = {page: page};
        console.log(data)
        if (searchType) {
            url = '/search';
            data.type = searchType;
        }
        $.getJSON(url, data, function (response) {
            totalPage = Math.ceil(response.total / pageSize);
            if (!paginationInstance) {
                initPagination();
            } else {
                paginationInstance.setPage(page, totalPage);
            }
            renderTable(response.data);
        });
    }

    function fetchDateRangeData(page, startDate, endDate, selection) {
        let url = '/records_date_range';
        let data = {
            start_date: startDate,
            end_date: endDate,
            selection: selection,
            page: page
        };
        $.getJSON(url, data, function (response) {
            totalPage = Math.ceil(response.total / pageSize);
            if (!paginationInstance) {
                initPagination();
            } else {
                paginationInstance.setPage(page, totalPage); // 重置到第一页
            }
            renderTable(response.data);
        });
    }


    function renderTable(data) {
        let html = '';
        data.forEach(function (item) {
            html += '<tr class="body-row">';
            html += '<td class="body-cell">' + item.task_title + '</td>';
            html += '<td class="body-cell">' + item.kind + '</td>';
            html += '<td class="body-cell">' + item.point + '</td>';
            html += '<td class="body-cell">' + item.finish_time + '</td>';
            html += '</tr>';
        });
        $('#data-container').html(html);
        adjustTableHeight();
    }

    function adjustTableHeight() {
        var rows = $('#data-container tr').length;
        var rowHeight = 40;
        var tableHeight = rows * rowHeight;
        $('.table_p').height(tableHeight);
    }

    $('.view-btn.add-points-btn').on('click', function () {
        performSearch('add_points');
    });

    $('.view-btn.deduct-points-btn').on('click', function () {
        performSearch('deduct_points');
    });

    $('.view-btn.weekly-points-btn').on('click', function () {
        performSearch('weekly_points');
    });

    $('.view-btn.monthly-points-btn').on('click', function () {
        performSearch('monthly_points');
    });

    $('.view-btn.all-records-btn').on('click', function () {
        performSearch('all_records');
    });

    function performSearch(type) {
        currentSearchType = type; // 设置当前搜索类型
        fetchData(1, type); // 从第一页开始搜索
    }

    fetchData(currentPage); // 初始加载
});
