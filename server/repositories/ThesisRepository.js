"use strict";

const db = require("./db");

/**
 * create a new object that represent thesis 
 * @returns 
 */
function newThesis(id, title, supervisor, coSupervisors, keywords, type, groups, description, knowledge, note, expiration_date, level, cds, creation_date, status){
  return{
    id: id,
    title: title,
    supervisor: supervisor,
    coSupervisor: coSupervisors,
    keywords: keywords,
    type: type,
    groups: groups,
    description: description,
    knowledge: knowledge,
    note: note,
    expiration_date: expiration_date,
    level: level,
    cds: cds,
    creation_date: creation_date,
    status: status,
  };
}

//==================================Create==================================

/**
 * add a new thesis
 * @returns SUCCESS: the new entry with the new ID is returned
 * @returns ERROR: sqlite error is returned in the form {error: "message"}
 */
exports.addThesis = (title, supervisor, keywords, type, groups, description, knowledge, note, expiration_date, level, cds, creation_date, status) => {
  if(!(title && supervisor && keywords && type && groups && description && knowledge && note && expiration_date && level && cds && creation_date && status))
    throw {error: "Parameters can not be null or undefined"}
  const sql = `INSERT INTO Thesis(title, supervisor, keywords, type, groups, description, knowledge, note, expiration_date, level, cds, creation_date, status)
               VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  return new Promise((resolve, reject) => {
    db.run(sql, [title, supervisor, keywords, type, groups, description, knowledge, note, expiration_date, level, cds, creation_date, status], function (err) {
        if (err) {
          return reject({error: err.message});
        }
        resolve(newThesis(this.lastID, title, supervisor, keywords, type, groups, description, knowledge, note, expiration_date, level, cds, creation_date, status));
      }
    );
  });
};

//==================================Get==================================

/**
 * Return the thesis with the specificated ID
 * @param {*} id_thesis 
 * @returns an object that represent thesis or undefined if id does not exist
 * @returns ERROR: sqlite error is returned in the form {error: "message"}
 */
exports.getById = (id_thesis) => {
  if(!id_thesis || id_thesis<0)
    throw {error:"id_thesis must exists and be greater than 0"};
  const thesisTitlesSQL = 'SELECT * FROM Thesis WHERE id = ?'
  return new Promise((resolve, reject) => {
    db.get(thesisTitlesSQL, [id_thesis], function (err, result) {
      if (err) {
        return reject({error: err.message});
      }
      resolve(result);
    })
  });
}

/**
 * Find all the active thesis of onw specific supervisor 
 * @param {*} supervisorId, id of that specific supervisor 
 * @returns a list of thesis object
 * @returns ERROR: sqlite error is returned in the form {error: "message"}
 */
exports.getActiveBySupervisor = (supervisorId) => {
  if(!supervisorId || supervisorId<0)
    throw {error:"supervisorId must exists and be greater than 0"};
  const sql = `SELECT * FROM thesis WHERE status = 1 AND supervisor = ?`
  return new Promise( (resolve, reject) => {
    db.all(sql, [supervisorId], (err, rows) => {
      if(err) {
        return reject({error: err.message});
      }
      else if(rows.length === 0) {
        resolve([])
      }
      else resolve(rows)
    })
  })
}

/**
 * Composes the query and performs an advanced search
 *
 * @param {*} from defines the index of 1st chosen entries (offset)
 * @param {*} to defines the index of last chosen entries (to-from = no_entries)
 * @param {*} order string with A(SC) or D(ESC) (ie titleD will became ORDER BY title DESC)
 * @param {*} specific true if your research is for something that is exactily like your params
 * @param {*} title string
 * @param {*} idSupervisors list of ids
 * @param {*} idCoSupervisorsThesis list of ids
 * @param {*} keyword Array of String
 * @param {*} type string
 * @param {*} groups Array of String
 * @param {*} knowledge Array of String
 * @param {*} expiration_date string
 * @param {*} cds Array of String
 * @param {*} creation_date string
 * @param {*} level 0 (bachelor) | 1 (master)
 * @returns list of thesis objects
 */
exports.advancedResearch = (from, to, order, specific, title, idSupervisors, idCoSupervisorsThesis, keyword, type, groups, knowledge, expiration_date, cds, creation_date, level) => {
  if(!from || !to || !order || !specific)
    throw {error: "from, to, order and specific must be defined"}
  let sql = sqlQueryCreator(from, to, order, specific, title, idSupervisors, idCoSupervisorsThesis, keyword, type, groups, knowledge, expiration_date, cds, creation_date, level);
  const params = sql[1];
  sql = sql[0];
  return new Promise((resolve, reject) => {
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject({error: err.message});
      }
      const res = rows.map((e) => (newThesis(e.id, e.title, e.supervisor, [], e.keywords, e.type, e.groups, e.description, e.knowledge, e.note, e.expiration_date, e.level, e.cds, e.creation_date, e.status)));
      resolve(res);
    });
  });
};

/**
 * Find the thesisId given the CoSupervisor id
 * @param {*} id: id of the co-supervisor
 * @returns [id1, id2, ....]
 */
exports.getIdByCoSupervisorId = (id) => {
  if(!id || id<0)
      throw {error: "id must be greather than 0"}
  let idsThesis = [];
  const sqlIdThesis = "SELECT id_thesis FROM CoSupervisorThesis WHERE id_cosupervisor = ?";
  return new Promise((resolve, reject) => {
      db.all(sqlIdThesis, [id], (err, rows) => {
          if (err) {
              reject({error: err.message});
              return;
          }
          rows.map((e) => {
              idsThesis.push(e.id_thesis);
          });
          resolve(idsThesis);
      });
  });
}

//==================================Set==================================
/**
 * Update thesis with the same id with new parameters 
 * @param {*} id integer > 0
 * @param {*} title string
 * @param {*} supervisorId integer > 0
 * @param {*} keywords string
 * @param {*} type string
 * @param {*} groups string
 * @param {*} description string
 * @param {*} knowledge string
 * @param {*} note string
 * @param {*} expiration_date string 
 * @param {*} level 0 (bachelor) | 1 (master)
 * @param {*} cds string
 * @param {*} creation_date string
 * @param {*} status 0 | 1 (published)
 * @returns the number of row modified, if different from 1 it is an error
 * @returns ERROR: sqlite error is returned in the form {error: "message"}
 */
exports.updateThesis = (id, title, supervisor, keywords, type, groups, description, knowledge, note, expiration_date, level, cds, creation_date, status)=> {
  if(!(title && supervisor && keywords && type && groups && description && knowledge && note && expiration_date && level && cds && creation_date && status))
    throw {error: "Parameters can not be null or undefined"}
  const sql = `UPDATE Thesis 
               SET title = ?, supervisor = ?, keywords = ?, type = ?, groups = ?, description = ?, 
                   knowledge = ?, note = ?, expiration_date = ?, level = ?, cds = ?, creation_date = ?, status = ?
               WHERE id = ?`;
  return new Promise((resolve, reject) => {
    db.run(sql,[title,supervisor,keywords,type,groups,description,knowledge,note,expiration_date,level,cds,creation_date,status,id], function (err) {
        if (err) {
          return reject({error: err.message});
        }
        if (this.changes === 0) {
          return reject({ error: "No rows updated. Thesis ID not found." });
          
        }
        resolve(this.changes);
      }
    );
  });
};
/**
 * Update the status of the thesis with the same id
 * @param {*} id integer > 0
 * @param {*} status 0 | 1 (published)
 * @returns the number of row modified, if different from 1 it is an error
 * @returns ERROR: sqlite error is returned in the form {error: "message"}
 */
exports.setStatus = (id, status) => {
  if(!id || id<0)
    throw {error: "id must exists and be greater than 0"};
  if(status==undefined || status<0 || status>1)
    throw {error: "status must exists and be zero or one"};
  const updateThesisSQL = 'UPDATE Thesis SET status = ? WHERE id = ?';
  return new Promise((resolve, reject)=>{
    db.run(updateThesisSQL, [status, id], function (err) {
      if (err) {
        return reject({error: err.message});
      }
      if (this.changes === 0) {
        return reject({ error: "No rows updated. Thesis ID not found." });
      }
      resolve(this.changes);
    });
  })
}

//==================================Delete==================================

//==================================Support==================================

/**
 * @returns SUCCESS: object defined as {nPage: 1}
 * @returns ERROR: sqlite error is returned in the form {error: "message"}
 */
exports.numberOfPage = (specific, title, idSupervisors, idCoSupervisorsThesis, keyword, type, groups, knowledge, expiration_date, cds, creation_date, level) => {
  let sql = sqlQueryCreator( undefined, undefined, "titleD", specific, title, idSupervisors, idCoSupervisorsThesis, keyword, type, groups, knowledge, expiration_date, cds, creation_date, level);
  const params = sql[1];
  sql = sql[0];
  sql = sql.slice(8);
  sql = "SELECT COUNT(*) AS cnt"+sql;
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject({error: err.message});
      }
      resolve({ nRows: rows[0] ? rows[0].cnt : 0 });
    });
  });
};

//Only for advancedSearch
//Trasform order and make it suitable for an SQL query
function transformOrder(order) {
  switch (order) {
    case "titleD":
      return "title DESC ";
    case "titleA":
      return "title ASC ";
    case "supervisorD":
      return "supervisor DESC ";
    case "supervisorA":
      return "supervisor ASC ";
    case "co-supervisorD":
      return "co-supervisor DESC ";
    case "co-supervisorA":
      return "co-supervisor ASC ";
    case "keywordD":
      return "keywords DESC ";
    case "keywordA":
      return "keywords ASC ";
    case "typeD":
      return "type DESC ";
    case "typeA":
      return "type ASC ";
    case "groupsD":
      return "groups DESC ";
    case "groupsA":
      return "groups ASC ";
    case "knowledgeD":
      return "knowledge DESC ";
    case "knowledgeA":
      return "knowledge ASC ";
    case "expiration_dateD":
      return "expiration_date DESC ";
    case "expiration_dateA":
      return "expiration_date ASC ";
    case "cdsD":
      return "cds DESC ";
    case "cdsA":
      return "cds ASC ";
    case "creation_dateD":
      return "creation_date DESC ";
    case "creation_dateA":
      return "creation_date ASC ";
    default:
      return `Azione non valida per ${order}`;
  }
}

/**
 * Only for advancedSearch
 * Composes the query and performs an advanced search
 *
 * @param {*} from defines the index of 1st chosen entries (offset)
 * @param {*} to defines the index of last chosen entries (to-from = no_entries)
 * @param {*} order string with A(SC) or D(ESC) (ie titleD will became ORDER BY title DESC)
 * @param {*} specific true if your research is for something that is exactily like your params
 * @param {*} title string
 * @param {*} idSupervisors list of ids
 * @param {*} idCoSupervisorsThesis list of ids
 * @param {*} keyword Array of string
 * @param {*} type string
 * @param {*} groups Array of  string
 * @param {*} knowledge string
 * @param {*} expiration_date TOBE defined
 * @param {*} cds Array of string
 * @param {*} creation_date TOBE defined
 * @param {*} level 0 (bachelor) | 1 (master)
 * @returns list of thesis objects
 */
function sqlQueryCreator(from, to, order, specific, title, idSupervisors, idCoSupervisorsThesis, keyword, type, groups, knowledge, expiration_date, cds, creation_date, level) {
  let sql = "SELECT * FROM Thesis WHERE status=1 AND level=" + level + " ";
  let params = [];
  specific = !specific;
  // checks for title if exists
  if (title != null) {
    sql += "AND title ";
    sql += specific ? "LIKE ?" : "= ?";
    params.push(specific ? `%${title}%` : title);
  }
  // checks for supervisors ids if the array is defined
  if (idSupervisors != null && idSupervisors.length > 0) {
    sql += 'AND (supervisor ';
    sql+=specific ? 'LIKE ?' : '= ?';
    params.push(specific ? `%${idSupervisors[0].id}%` : idSupervisors[0].id);
    // adding to the query each id we got considering also homonyms, slice for skipping the first one (already handled)
    idSupervisors.slice(1).forEach((e) => {
      sql += "OR supervisor ";
      sql += specific ? "LIKE ?" : "= ?";
      params.push(specific ? `%${e.id}%` : e.id);
    });
    sql += ") ";
  }

  // checks for cosupervisors ids if the array is defined
  if (idCoSupervisorsThesis != null && idCoSupervisorsThesis.length > 0) {
    sql += "AND (id ";
    sql += "= ?";
    params.push(
      specific ? `%${idCoSupervisorsThesis[0]}%` : idCoSupervisorsThesis[0]
    );
    // adding to the query each id we got considering also homonyms, slice for skipping the first one (already handled)
    idCoSupervisorsThesis.slice(1).forEach((e) => {
      sql += "OR id ";
      sql += "= ?";
      params.push(specific ? `%${e.id}%` : e.id);
    });
    sql += ") ";
  }

  if (keyword != null) {
    sql += "AND keywords ";
    sql += specific ? "LIKE ?" : "= ?";
    let k = Array.isArray(keyword) ? "" : keyword;
    if (Array.isArray(keyword))
      keyword.forEach((e) => {
        k += e + ", ";
      });
    params.push(specific ? `%${k}%` : k);
  }
  if (type != null) {
    sql += "AND type ";
    sql += specific ? "LIKE ? " : "= ? ";
    let t = Array.isArray(type) ? "" : type;
    if (Array.isArray(type))
      type.forEach((e) => {
        t += e + ", ";
      });
    params.push(specific ? `%${t}%` : e);
  }
  if (groups != null) {
    sql += "AND groups ";
    sql += specific ? "LIKE ? " : "= ? ";
    let t = Array.isArray(groups) ? "" : groups;
    if (Array.isArray(groups))
      type.forEach((e) => {
        t += e + ", ";
      });
    params.push(specific ? `%${t}%` : e);
  }
  if (knowledge != null) {
    sql += "AND knowledge ";
    sql += specific ? "LIKE ?" : "= ?";
    params.push(specific ? `%${knowledge}%` : knowledge);
  }
  if (expiration_date != null) {
    sql += "AND expiration_date ";
    sql += specific ? "<= ? " : "= ? ";
    params.push(expiration_date);
  }
  if (cds != null) {
    sql += "AND cds ";
    sql += specific ? "LIKE ? " : "= ? ";
    let t = Array.isArray(cds) ? "" : cds;
    if (Array.isArray(cds))
      type.forEach((e) => {
        t += e + ", ";
      });
    params.push(specific ? `%${t}%` : e);
  }
  if (creation_date != null) {
    sql += "AND creation_date ";
    sql += specific ? ">= ? " : "= ? ";
    params.push(creation_date);
  }
  sql += "ORDER BY " + transformOrder(order);
  if (to != undefined && from != undefined) sql += " LIMIT " + (to - from) + " OFFSET " + from;
  return [sql, params];
}

//==================================Virtual CLock==================================

const applicationRepository = require('./ApplicationRepository.js')
/**
 * Designed for Virtual clock
 * @param {*} date 
 */
exports.selectExpiredAccordingToDate = (date) => {
  const sql = 'SELECT id FROM Thesis WHERE expiration_date <= ? AND status = 1'

  return new Promise( (resolve, reject) => {
    db.all(sql, [date], (err, rows) => {
      if(err)
        return reject({error: err.message});
      else if(rows.length == 0)
        resolve([])
      resolve(rows.map(a => a.id))
    })
  })
}

/**
 * Designed for Virtual clock
 * @param {*} date 
 */
exports.selectRestoredExpiredAccordingToDate = (date) => {
  const sql = 'SELECT id FROM Thesis WHERE expiration_date > ? AND expiration_date != 0 AND status = 0'

  return new Promise( (resolve, reject) => {
    db.all(sql, [date], (err, rows) => {
      if(err)
        return reject({error: err.message});
      else if(rows.length == 0)
        resolve([])
      resolve(rows.map(a => a.id))
    })
  })
}

/**
 * Designed for Virtual clock
 * @param {*} ids of updatable thesis 
 */
exports.setExpiredAccordingToIds = (ids) => {
  const placeholders = ids.map(() => '?').join(',');
  const sql = `UPDATE Thesis SET status = 0 WHERE id IN (${placeholders})`

  return new Promise( (resolve, reject) => {
    db.run(sql, ids, (err) => {
      if(err)
      return reject({error: err.message});
      else {
        applicationRepository.setCancelledAccordingToThesis(ids)
          .then( resolve(true) )
          .catch( err => reject(err) )
      }
    })
  })
}

/**
 * Designed for Virtual clock
 * @param {*} ids of updatable thesis  
 */
exports.restoreExpiredAccordingToIds = (ids) => {
  const placeholders = ids.map(() => '?').join(',');
  const sql = `UPDATE Thesis SET status = 1 WHERE id IN (${placeholders})`

  return new Promise( (resolve, reject) => {
    db.run(sql, ids, (err) => {
      if(err)
        return reject({error: err.message});
      else {
        applicationRepository.setPendingAccordingToThesis(ids)
          .then( resolve(true) )
          .catch( err => reject(err) )
      }
    })
  })
}