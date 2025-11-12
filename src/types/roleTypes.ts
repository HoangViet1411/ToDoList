
export interface CreateRoleDto {
    role_name?: string;
    description?: string   ;

}

export interface UpdateRoleDto {
    role_name?: string;
    description?: string;
}

export interface RoleRespone {
    id?: number;
    role_name?: string;
    desciption?: string;
    created_at?: Date;
    updated_at?: Date;
    deleled_at?: Date | null;
}
