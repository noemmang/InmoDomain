// Tipos que reflejan los DTOs que devuelve el Gateway (campos JSON en inglés, camelCase).

export interface AuthTokens {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    registeredAt: string;
}

export interface Province {
    provinceCode: string;
    name: string;
    autonomousCommunity: string;
    population: number;
}

export interface Favorite {
    id: string;
    provinceCode: string;
    provinceName: string;
    createdAt: string;
}

// Índices de una provincia en un trimestre; cualquiera puede ser null si aún no hay datos.
export interface ScorePeriod {
    period: string;
    priceIndex: number | null;
    priceIndexNationalRanking: number | null;
    priceTrendIndex: number | null;
    priceTrendIndexYearOverYear: number | null;
    activityIndex: number | null;
    activityIndexNationalRanking: number | null;
    score: number | null;
}

export interface CompareEntry extends ScorePeriod {
    provinceCode: string;
}

export interface PropertySale {
    period: string;
    housingStatus: string;
    operationsCount: number;
}

export interface AppraisedValue {
    period: string;
    age: string;
    pricePerSquareMeter: number;
}

export interface CustomTrend {
    trendQuarters: number;
    hasSufficientData: boolean;
    value: number | null;
}

export interface ProvinceAnalytics {
    provinceCode: string;
    history: ScorePeriod[];
    propertySales: PropertySale[];
    appraisedValues: AppraisedValue[];
    isFavorite: boolean | null;
    customTrend: CustomTrend | null;
}

export type AlertMetric =
    | "property_score"
    | "indice_precio"
    | "indice_tendencia_precio"
    | "indice_actividad"
    | "precio_m2";

export type AlertCondition = "mayor_que" | "menor_que";

export interface Alert {
    id: string;
    provinceCode: string;
    metric: AlertMetric;
    condition: AlertCondition;
    threshold: number;
    active: boolean;
    createdAt: string;
    lastTriggeredAt: string | null;
    lastTriggeredPeriod: string | null;
}

export interface AlertInput {
    provinceCode: string;
    metric: AlertMetric;
    condition: AlertCondition;
    threshold: number;
}

export interface AppNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    provinceCode: string | null;
    read: boolean;
    sentAt: string;
}