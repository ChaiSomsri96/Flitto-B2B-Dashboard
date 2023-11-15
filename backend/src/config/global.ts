export default {
    DOMAIN_TYPE: [
        'tc', 'translator', 'reviewer', 'admin'
    ],
    USER_TYPE: [ 4, 5, 6, 1 ],
    ROLE: [
        'admin', 'company', 'requester', 'tc', 'translator', 'reviewer', 'manager'
    ],
    WORK_TYPE: [4, 5, 6],
    STATUS: [
        'preparing', // 준비중
        'tc_ing',  // TC중
        'tc_complete', // TC완료
        'translating', // 번역중
        'translation_complete', // 번역완료
        'reviewing', // 검수중
        'review_complete', // 검수완료
        'subtitle_apply', // 자막적용
        'subtitle_apply_failed', // 자막적용 실패
        'subtitle_apply_failed',
        'subtitle_apply_failed',
        'subtitle_apply_failed'
    ]
};