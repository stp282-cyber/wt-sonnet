export interface Section {
    id: string;
    major_unit: string;
    minor_unit: string;
    unit_name: string;
    sequence: number;
    word_count: number;
}

export interface CurriculumItem {
    id: string;
    sequence: number;
    item_type: 'wordbook' | 'listening';
    item_id: string;
    daily_amount_type?: 'section' | 'count';
    daily_amount?: number;
    daily_word_count?: number;
    daily_section_amount?: number;
    item_details: {
        id: string;
        title: string;
        word_count?: number;
    } | null;
    sections: Section[];
    test_type?: string;
    passing_score?: number;
    time_limit_seconds?: number;
}

export interface StudentCurriculum {
    id: string;
    student_id: string;
    curriculum_id: string;
    start_date: string;
    study_days: string[] | string;
    current_item_id: string | null;
    current_progress: number;
    curriculums: {
        id: string;
        name: string;
        description: string;
    };
    curriculum_items: CurriculumItem[];
    setting_overrides?: {
        passing_score?: number;
        time_limit_seconds?: number;
        daily_amount?: number;
        daily_amount_type?: 'section' | 'count';
        test_type?: string;
    };
    breaks?: {
        start_date: string;
        end_date: string;
        reason?: string;
    }[];
}

export interface ScheduleItem {
    dayIndex: number;
    itemTitle: string;
    majorUnit: string;
    minorUnit: string;
    unitName: string;
    itemType: 'wordbook' | 'listening';
    wordCount: number;
    progressRange: string;
    status: 'completed' | 'today' | 'upcoming';
    item?: CurriculumItem;
    progressStart?: number;
    progressEnd?: number;
    section?: Section;
}

export const DAY_MAP: { [key: string]: number } = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
};
